"""Offline behavioral tests. No real DNS, certificate authority or Nginx calls."""
from pathlib import Path
import os
import shutil
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "issue-cert.sh"
BASH = r"D:\SoftWare\Git\bin\bash.exe"
OPENSSL = r"D:\SoftWare\Git\usr\bin\openssl.exe"
DOMAIN = "dev-img.test.invalid"
MOCK_ACME = r'''#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$*" >> "$MOCK_TRACE"
task_command=''
task_key=''
task_cert=''
while [ "$#" -gt 0 ]; do
  case "$1" in
    --version|--register-account|--issue|--renew|--install-cert) task_command="$1" ;;
    --key-file) task_key="$2"; shift ;;
    --fullchain-file) task_cert="$2"; shift ;;
  esac
  shift
done
case "$task_command" in
  --version) echo 'mock acme version' ;;
  --register-account) echo 'mock account registered' ;;
  --issue)
    [ "$HW_AK" = 'AK_TEST_ONLY' ] && [ "$HW_SK" = 'SK_TEST_ONLY' ]
    echo 'mock acme issuing'
    exit "${MOCK_ISSUE_RC:-0}"
    ;;
  --renew)
    [ "$HW_AK" = 'AK_TEST_ONLY' ] && [ "$HW_SK" = 'SK_TEST_ONLY' ]
    echo 'mock acme renewing'
    exit "${MOCK_RENEW_RC:-0}"
    ;;
  --install-cert)
    if [ "${MOCK_INSTALL_RC:-0}" -ne 0 ]; then exit "$MOCK_INSTALL_RC"; fi
    cp "$MOCK_FIXTURE_CERT" "$task_cert"
    cp "$MOCK_FIXTURE_KEY" "$task_key"
    echo 'mock certificate installed'
    ;;
esac
'''


class IssueCertTests(unittest.TestCase):
    def setUp(self):
        self.case_dir = Path(tempfile.mkdtemp(prefix="cert-case-", dir=ROOT / "validation"))
        self.home = self.case_dir / "home"
        self.config = self.home / ".config/dev-img-acme"
        self.config.mkdir(parents=True)
        # Native sandbox fixture creation; the subprocess uses relative paths so
        # MSYS mkdir -p does not request writes on protected C:\Users ancestors.
        (self.home / ".local/state/dev-img-acme").mkdir(parents=True)
        self.acme_dir = self.home / ".acme.sh"
        (self.acme_dir / "dnsapi").mkdir(parents=True)
        (self.acme_dir / "dnsapi/dns_hw.sh").write_text("# mock plugin\n", encoding="utf-8")
        (self.acme_dir / "acme.sh").write_text(MOCK_ACME, encoding="utf-8")
        os.chmod(self.acme_dir / "acme.sh", 0o700)
        (self.config / "settings.sh").write_text(
            f"CERT_DOMAIN='{DOMAIN}'\nACME_EMAIL='tester@test.invalid'\n"
            "export HW_Region='cn-north-4'\n"
            'HW_AK_FILE="$HOME/.config/dev-img-acme/huawei-ak"\n'
            'HW_SK_FILE="$HOME/.config/dev-img-acme/huawei-sk"\n', encoding="utf-8")
        (self.config / "huawei-ak").write_bytes(b"AK_TEST_ONLY\r\n")
        (self.config / "huawei-sk").write_bytes(b"SK_TEST_ONLY\n")
        self.cert_dir = self.home / "installed"
        self.cert_dir.mkdir()
        self.cert = self.case_dir / "fixture.pem"
        self.key = self.case_dir / "fixture.key"
        result = subprocess.run([
            OPENSSL, "req", "-x509", "-newkey", "rsa:2048", "-nodes",
            "-keyout", str(self.key), "-out", str(self.cert), "-days", "1",
            "-subj", f"/CN={DOMAIN}", "-addext", f"subjectAltName=DNS:{DOMAIN}"
        ], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        mock_bin = self.home / "mock-bin"
        mock_bin.mkdir()
        # Every curl call is intercepted, including installer failure tests.
        (mock_bin / "curl").write_text(
            '#!/bin/bash\nif [ "${MOCK_DOWNLOAD_RC:-0}" -ne 0 ]; then exit "$MOCK_DOWNLOAD_RC"; fi\n'
            'cat "$MOCK_INSTALLER"\n', encoding="utf-8")
        os.chmod(mock_bin / "curl", 0o700)
        (mock_bin / "nginx-test").write_text(
            '#!/bin/bash\nprintf "%s\\n" "$*" >> "$MOCK_NGINX_TRACE"\n'
            'if [[ "$*" == *" -t" ]]; then exit "${MOCK_NGINX_TEST_RC:-0}"; fi\n'
            'exit "${MOCK_NGINX_RELOAD_RC:-0}"\n', encoding="utf-8")
        (mock_bin / "powershell-test").write_text(
            '#!/bin/bash\nexit "${MOCK_PROCESS_RC:-0}"\n', encoding="utf-8")
        os.chmod(mock_bin / "nginx-test", 0o700)
        os.chmod(mock_bin / "powershell-test", 0o700)
        (mock_bin / "flock").write_text('#!/bin/bash\nexit "${MOCK_LOCK_RC:-0}"\n', encoding="utf-8")
        os.chmod(mock_bin / "flock", 0o700)
        template = self.case_dir / "mock-acme-template.sh"
        template.write_text(MOCK_ACME, encoding="utf-8")
        installer = self.case_dir / "installer.sh"
        installer.write_text(
            '#!/bin/sh\nset -e\ntask_install_home="$HOME/.acme.sh"\n'
            'while [ "$#" -gt 0 ]; do\n'
            '  if [ "$1" = --home ]; then task_install_home="$2"; shift; fi\n'
            '  shift\ndone\n'
            '[ -d "$task_install_home/dnsapi" ] || mkdir -p "$task_install_home/dnsapi"\n'
            'cp "$MOCK_TEMPLATE" "$task_install_home/acme.sh"\n'
            'chmod 700 "$task_install_home/acme.sh"\n'
            'printf "# mock plugin\\n" > "$task_install_home/dnsapi/dns_hw.sh"\n', encoding="utf-8")
        self.env = dict(os.environ, CERT_DIR="./installed", DNS_SLEEP="1", RELOAD_NGINX="0",
                        MOCK_TRACE=(self.case_dir / "calls.txt").as_posix(),
                        MOCK_FIXTURE_CERT=self.cert.as_posix(), MOCK_FIXTURE_KEY=self.key.as_posix(),
                        MOCK_TEMPLATE=template.as_posix(), MOCK_INSTALLER=installer.as_posix(),
                        NGINX_EXE="./mock-bin/nginx-test", WINDOWS_POWERSHELL="./mock-bin/powershell-test",
                        MOCK_NGINX_TRACE=(self.case_dir / "nginx-calls.txt").as_posix())

    def tearDown(self):
        # Only remove a freshly created test directory inside this artifact's validation folder.
        assert self.case_dir.resolve().is_relative_to((ROOT / "validation").resolve())
        shutil.rmtree(self.case_dir)

    def run_script(self, *args, interactive=False, input_text=None, clear_env=(), **overrides):
        self.assertTrue(SCRIPT.is_file(), "Logging certificate script has not been implemented")
        script = SCRIPT
        if interactive:
            # Windows test runner has no PTY. Inject only the pre-pipeline TTY
            # detection result in a disposable copy; production has no override.
            source = SCRIPT.read_text(encoding="utf-8")
            marker = '[[ -t 0 && -t 1 ]] && TASK_INTERACTIVE=1'
            self.assertIn(marker, source)
            script = self.home / "interactive-script.sh"
            script.write_text(source.replace(marker, 'TASK_INTERACTIVE=1'), encoding="utf-8")
        env = dict(self.env, **overrides)
        for name in clear_env:
            env.pop(name, None)
        command = 'export HOME=.; export PATH="./mock-bin:/usr/bin:/bin"; task_script="$1"; shift; exec /bin/bash "$task_script" "$@"'
        result = subprocess.run([BASH, "--noprofile", "--norc", "-c", command,
                                 "_", str(script), *args], cwd=self.home,
                                env=env, input=input_text.encode("utf-8") if input_text is not None else None,
                                capture_output=True, timeout=25)
        # Binary stdin avoids Windows converting test answers from LF to CRLF.
        result.stdout = result.stdout.decode("utf-8")
        result.stderr = result.stderr.decode("utf-8")
        return result

    def assert_logged(self, result, mode="issue"):
        logs = list((self.home / ".local/state/dev-img-acme").glob(f"{mode}-*.log"))
        self.assertEqual(len(logs), 1)
        log = logs[0].read_text(encoding="utf-8")
        self.assertNotIn("AK_TEST_ONLY", log)
        self.assertNotIn("SK_TEST_ONLY", log)
        self.assertIn("[1/6]", log)
        self.assertIn("[1/6]", result.stdout)
        return log

    def test_success_is_logged_and_files_installed(self):
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        log = self.assert_logged(result)
        self.assertIn("[SUCCESS]", log)
        self.assertTrue((self.cert_dir / "fullchain.pem").is_file())
        self.assertTrue((self.cert_dir / "privkey.pem").is_file())

    def test_legacy_lego_file_variables_are_accepted(self):
        settings = self.config / "settings.sh"
        text = settings.read_text(encoding="utf-8")
        text = text.replace("HW_AK_FILE", "HUAWEICLOUD_ACCESS_KEY_ID_FILE")
        text = text.replace("HW_SK_FILE", "HUAWEICLOUD_SECRET_ACCESS_KEY_FILE")
        text = text.replace("HW_Region='cn-north-4'", "HUAWEICLOUD_REGION='cn-north-1'")
        settings.write_text(text, encoding="utf-8")
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("cn-north-1", self.assert_logged(result))
        self.assertTrue((self.cert_dir / "fullchain.pem").is_file())

    def test_default_key_file_paths_are_used_if_not_configured(self):
        settings = self.config / "settings.sh"
        lines = settings.read_text(encoding="utf-8").splitlines()
        settings.write_text("\n".join(line for line in lines if "_FILE=" not in line) + "\n", encoding="utf-8")
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("[SUCCESS]", self.assert_logged(result))

    def test_current_names_take_precedence_over_legacy_names(self):
        with (self.config / "settings.sh").open("a", encoding="utf-8") as settings:
            settings.write("HUAWEICLOUD_ACCESS_KEY_ID_FILE='/invalid-old-path'\n")
            settings.write("HUAWEICLOUD_SECRET_ACCESS_KEY_FILE='/invalid-old-path'\n")
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("[SUCCESS]", self.assert_logged(result))

    def test_missing_ak_reports_path_and_does_not_issue(self):
        (self.config / "huawei-ak").unlink()
        result = self.run_script()
        self.assertNotEqual(result.returncode, 0)
        log = self.assert_logged(result)
        self.assertIn("huawei-ak", log)
        self.assertIn("[FAILED]", log)
        self.assertFalse((self.cert_dir / "fullchain.pem").exists())

    def test_empty_ak_reports_failure(self):
        (self.config / "huawei-ak").write_text("\n", encoding="utf-8")
        result = self.run_script()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("[FAILED]", self.assert_logged(result))

    def test_issue_error_preserves_exit_code_and_stops_install(self):
        result = self.run_script(MOCK_ISSUE_RC="7")
        self.assertEqual(result.returncode, 7, result.stdout + result.stderr)
        self.assertIn("[FAILED]", self.assert_logged(result))
        self.assertFalse((self.cert_dir / "fullchain.pem").exists())

    def test_skip_continues_install_and_reports_skip(self):
        result = self.run_script(MOCK_ISSUE_RC="2")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("[SKIPPED]", self.assert_logged(result))
        self.assertTrue((self.cert_dir / "fullchain.pem").exists())

    def test_install_error_preserves_exit_code(self):
        result = self.run_script(MOCK_INSTALL_RC="8")
        self.assertEqual(result.returncode, 8, result.stdout + result.stderr)
        self.assertIn("[FAILED]", self.assert_logged(result))

    def test_missing_plugin_fails_before_issue(self):
        (self.acme_dir / "dnsapi/dns_hw.sh").unlink()
        result = self.run_script()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("dns_hw", self.assert_logged(result))
        self.assertFalse((self.cert_dir / "fullchain.pem").exists())

    def test_acme_is_installed_when_missing_using_mock_downloader(self):
        (self.acme_dir / "acme.sh").unlink()
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("[SUCCESS]", self.assert_logged(result))

    def test_download_error_is_not_hidden_by_pipeline(self):
        (self.acme_dir / "acme.sh").unlink()
        result = self.run_script(MOCK_DOWNLOAD_RC="9")
        self.assertEqual(result.returncode, 9, result.stdout + result.stderr)
        self.assertIn("[FAILED]", self.assert_logged(result))

    def test_renew_skips_without_issuing_and_has_renew_log(self):
        result = self.run_script("renew", MOCK_RENEW_RC="2")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("[SKIPPED]", self.assert_logged(result, "renew"))
        trace = (self.case_dir / "calls.txt").read_text(encoding="utf-8")
        self.assertIn("--renew", trace)
        self.assertNotIn("--issue", trace)
        self.assertNotIn("--register-account", trace)
        self.assertNotIn("--force", trace)
        self.assertTrue((self.cert_dir / "fullchain.pem").is_file())

    def test_renew_success_installs_and_reloads_nginx(self):
        result = self.run_script("renew", RELOAD_NGINX="1")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("[SUCCESS]", self.assert_logged(result, "renew"))
        trace = (self.case_dir / "nginx-calls.txt").read_text(encoding="utf-8")
        self.assertIn("-t", trace)
        self.assertIn("-s reload", trace)

    def test_renew_failure_preserves_code_and_does_not_deploy(self):
        result = self.run_script("renew", MOCK_RENEW_RC="7")
        self.assertEqual(result.returncode, 7, result.stdout + result.stderr)
        self.assertIn("[FAILED]", self.assert_logged(result, "renew"))
        self.assertFalse((self.cert_dir / "fullchain.pem").exists())

    def test_deploy_does_not_require_dns_credentials(self):
        (self.config / "huawei-ak").unlink()
        (self.config / "huawei-sk").unlink()
        result = self.run_script("deploy")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("[SUCCESS]", self.assert_logged(result, "deploy"))
        trace = (self.case_dir / "calls.txt").read_text(encoding="utf-8")
        self.assertNotIn("--issue", trace)
        self.assertNotIn("--renew", trace)
        self.assertNotIn("--register-account", trace)

    def test_invalid_nginx_config_fails_without_reload(self):
        result = self.run_script("deploy", RELOAD_NGINX="1", MOCK_NGINX_TEST_RC="4")
        self.assertEqual(result.returncode, 4, result.stdout + result.stderr)
        self.assertIn("[FAILED]", self.assert_logged(result, "deploy"))
        trace = (self.case_dir / "nginx-calls.txt").read_text(encoding="utf-8")
        self.assertNotIn("-s reload", trace)

    def test_nginx_reload_failure_is_not_reported_success(self):
        result = self.run_script("deploy", RELOAD_NGINX="1", MOCK_NGINX_RELOAD_RC="8")
        self.assertEqual(result.returncode, 8, result.stdout + result.stderr)
        log = self.assert_logged(result, "deploy")
        self.assertIn("[FAILED]", log)
        self.assertNotIn("[SUCCESS]", log)

    def test_stopped_nginx_is_not_started(self):
        result = self.run_script("deploy", RELOAD_NGINX="1", MOCK_PROCESS_RC="2")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("[SUCCESS]", self.assert_logged(result, "deploy"))
        trace = (self.case_dir / "nginx-calls.txt").read_text(encoding="utf-8")
        self.assertIn("-t", trace)
        self.assertNotIn("-s reload", trace)

    def test_renew_does_not_install_a_fresh_acme_client(self):
        (self.acme_dir / "acme.sh").unlink()
        result = self.run_script("renew")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("[FAILED]", self.assert_logged(result, "renew"))
        self.assertFalse((self.acme_dir / "acme.sh").exists())

    def test_overlapping_maintenance_is_skipped_without_acme_calls(self):
        result = self.run_script("renew", MOCK_LOCK_RC="1")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("[SKIPPED]", self.assert_logged(result, "renew"))
        self.assertFalse((self.case_dir / "calls.txt").exists())

    def test_help_aliases_bypass_config_wizard_and_certificate_operations(self):
        (self.config / "settings.sh").unlink()
        outputs = []
        for option in ("help", "--help", "-h"):
            with self.subTest(option=option):
                result = self.run_script(option, interactive=True, input_text="")
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertIn("bash issue-cert.sh help", result.stdout)
                self.assertNotIn("[WIZARD]", result.stdout)
                self.assertFalse((self.config / "settings.sh").exists())
                self.assertFalse((self.case_dir / "calls.txt").exists())
                self.assertFalse(list((self.home / ".local/state/dev-img-acme").glob("*.log")))
                outputs.append(result.stdout)
        self.assertEqual(len(set(outputs)), 1)

    def test_init_requires_terminal_and_does_not_change_config(self):
        before = (self.config / "settings.sh").read_bytes()
        result = self.run_script("init")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("交互终端", result.stdout)
        self.assertEqual((self.config / "settings.sh").read_bytes(), before)
        self.assertFalse((self.case_dir / "calls.txt").exists())

    def test_init_creates_config_and_hidden_keys_without_acme(self):
        for name in ("settings.sh", "huawei-ak", "huawei-sk"):
            (self.config / name).unlink()
        answers = f"\n\n./installed\n\n{DOMAIN}\ntester@test.invalid\n\n0\nAK_TEST_ONLY\nSK_TEST_ONLY\n"
        result = self.run_script("init", interactive=True, input_text=answers)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        log = self.assert_logged(result, "init")
        self.assertIn("[CONFIGURED]", log)
        self.assertFalse((self.case_dir / "calls.txt").exists())
        self.assertEqual((self.config / "huawei-ak").read_text(encoding="utf-8"), "AK_TEST_ONLY\n")
        settings = (self.config / "settings.sh").read_text(encoding="utf-8")
        self.assertIn(DOMAIN, settings)
        self.assertNotIn("SK_TEST_ONLY", settings)
        self.assertNotIn("AK_TEST_ONLY", result.stdout + result.stderr)

    def test_init_preserves_legacy_keys_custom_settings_and_backup(self):
        settings = self.config / "settings.sh"
        original = settings.read_text(encoding="utf-8").replace("HW_AK_FILE", "HUAWEICLOUD_ACCESS_KEY_ID_FILE")
        original = original.replace("HW_SK_FILE", "HUAWEICLOUD_SECRET_ACCESS_KEY_FILE")
        original = original.replace("HW_Region='cn-north-4'", "HUAWEICLOUD_REGION='cn-north-1'")
        original += "# user's custom setting\nDNS_SLEEP=600\nRELOAD_CMD='printf custom'\n"
        settings.write_text(original, encoding="utf-8")
        ak_before = (self.config / "huawei-ak").read_bytes()
        result = self.run_script("init", interactive=True, input_text="\n" * 8)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("cn-north-1", result.stdout)
        self.assertIn(original, settings.read_text(encoding="utf-8"))
        backups = list(self.config.glob("settings.sh.bak-*"))
        self.assertEqual(len(backups), 1)
        self.assertEqual(backups[0].read_text(encoding="utf-8"), original)
        self.assertEqual((self.config / "huawei-ak").read_bytes(), ak_before)

    def test_complete_issue_in_terminal_does_not_prompt_or_rewrite(self):
        before = (self.config / "settings.sh").read_bytes()
        result = self.run_script("issue", interactive=True, input_text="")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertNotIn("[WIZARD]", result.stdout)
        self.assertEqual((self.config / "settings.sh").read_bytes(), before)

    def test_issue_auto_wizard_fills_missing_key_only(self):
        (self.config / "huawei-sk").unlink()
        result = self.run_script("issue", interactive=True, input_text="SK_TEST_ONLY\n")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("[WIZARD]", result.stdout)
        self.assertIn("[SUCCESS]", self.assert_logged(result))
        self.assertNotIn("SK_TEST_ONLY", result.stdout + result.stderr)

    def test_renew_never_prompts_even_with_terminal(self):
        (self.config / "huawei-sk").unlink()
        before = (self.config / "settings.sh").read_bytes()
        result = self.run_script("renew", interactive=True, input_text="SK_TEST_ONLY\n")
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("[WIZARD]", result.stdout)
        self.assertIn("huawei-sk", self.assert_logged(result, "renew"))
        self.assertFalse((self.config / "huawei-sk").exists())
        self.assertEqual((self.config / "settings.sh").read_bytes(), before)

    def test_missing_settings_renew_fails_without_creating_it(self):
        (self.config / "settings.sh").unlink()
        result = self.run_script("renew", interactive=True, input_text="unused\n")
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("[WIZARD]", result.stdout)
        self.assertFalse((self.config / "settings.sh").exists())

    def test_wizard_eof_leaves_settings_and_keys_unchanged(self):
        before = (self.config / "settings.sh").read_bytes()
        result = self.run_script("init", interactive=True, input_text="changed.test.invalid\n")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("[FAILED]", self.assert_logged(result, "init"))
        self.assertEqual((self.config / "settings.sh").read_bytes(), before)
        self.assertFalse(list(self.config.glob("settings.sh.bak-*")))

    def test_wizard_validation_reprompts_and_shell_quotes_domain_settings(self):
        for name in ("settings.sh", "huawei-ak", "huawei-sk"):
            (self.config / name).unlink()
        (self.home / "cert $(touch MUST_NOT_EXIST)").mkdir()
        answers = f"\n\n./cert $(touch MUST_NOT_EXIST)\n\nhttps://bad/\n{DOMAIN}\nyou@example.com\ntester@test.invalid\n\n7\n0\nAK_TEST_ONLY\nSK_TEST_ONLY\n"
        result = self.run_script("init", interactive=True, input_text=answers)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertFalse((self.home / "MUST_NOT_EXIST").exists())
        self.assertIn("请重新输入", result.stdout)
        # Loading the saved configuration must not execute the literal path.
        result = self.run_script("deploy")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertFalse((self.home / "MUST_NOT_EXIST").exists())

    def test_first_issue_guides_then_issues_in_same_run(self):
        for name in ("settings.sh", "huawei-ak", "huawei-sk"):
            (self.config / name).unlink()
        answers = f"\n\n\n\n{DOMAIN}\ntester@test.invalid\n\n\nAK_TEST_ONLY\nSK_TEST_ONLY\n"
        result = self.run_script("issue", interactive=True, input_text=answers)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        log = self.assert_logged(result)
        self.assertIn("[CONFIGURED]", log)
        self.assertIn("[SUCCESS]", log)

    def test_explicit_environment_reload_overrides_saved_setting(self):
        with (self.config / "settings.sh").open("a", encoding="utf-8") as settings:
            settings.write("RELOAD_NGINX=1\n")
        result = self.run_script("deploy", RELOAD_NGINX="0")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertFalse((self.case_dir / "nginx-calls.txt").exists())

    def test_issue_without_terminal_fails_instead_of_prompting(self):
        (self.config / "huawei-sk").unlink()
        result = self.run_script("issue", input_text="SK_TEST_ONLY\n")
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("[WIZARD]", result.stdout)
        self.assertFalse((self.config / "huawei-sk").exists())

    def test_wizard_eof_during_secret_input_does_not_create_either_key(self):
        for name in ("huawei-ak", "huawei-sk"):
            (self.config / name).unlink()
        before = (self.config / "settings.sh").read_bytes()
        result = self.run_script("init", interactive=True, input_text="\n" * 8 + "AK_TEST_ONLY\n")
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("AK_TEST_ONLY", self.assert_logged(result, "init"))
        self.assertFalse((self.config / "huawei-ak").exists())
        self.assertFalse((self.config / "huawei-sk").exists())
        self.assertEqual((self.config / "settings.sh").read_bytes(), before)

    def custom_path_answers(self):
        for name in ("custom settings", "custom acme", "custom installed", "custom logs"):
            (self.home / name).mkdir(exist_ok=True)
        return "./custom settings/settings.sh\n./custom acme\n./custom installed\n./custom logs\n" + "\n" * 4

    def test_custom_paths_persist_and_renew_loads_them_without_environment(self):
        (self.acme_dir / "account.conf").write_text("# test account state\n", encoding="utf-8")
        result = self.run_script("init", interactive=True, input_text=self.custom_path_answers())
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertTrue((self.config / "paths.conf").is_file())
        self.assertTrue((self.home / "custom settings/settings.sh").is_file())
        self.assertEqual((self.home / "custom acme/account.conf").read_text(encoding="utf-8"), "# test account state\n")
        self.assertTrue((self.acme_dir / "acme.sh").is_file(), "Original ACME state must remain")
        result = self.run_script("renew", clear_env=("CERT_DIR",), MOCK_RENEW_RC="2")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertNotIn("[WIZARD]", result.stdout)
        self.assertTrue((self.home / "custom installed/fullchain.pem").is_file())
        logs = list((self.home / "custom logs").glob("renew-*.log"))
        self.assertEqual(len(logs), 1)
        self.assertIn("custom settings/settings.sh", logs[0].read_text(encoding="utf-8"))
        self.assertNotIn("SK_TEST_ONLY", logs[0].read_text(encoding="utf-8"))

    def test_cancelled_path_change_does_not_save_locator_or_new_config(self):
        before = (self.config / "settings.sh").read_bytes()
        (self.home / "custom settings").mkdir()
        result = self.run_script("init", interactive=True, input_text="./custom settings/settings.sh\n")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual((self.config / "settings.sh").read_bytes(), before)
        self.assertFalse((self.home / "custom settings/settings.sh").exists())
        self.assertFalse((self.config / "paths.conf").exists())

    def test_missing_remembered_config_fails_instead_of_using_old_default(self):
        result = self.run_script("init", interactive=True, input_text=self.custom_path_answers())
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        (self.home / "custom settings/settings.sh").unlink()
        result = self.run_script("renew", clear_env=("CERT_DIR",))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("custom settings/settings.sh", result.stdout)
        self.assertNotIn("[WIZARD]", result.stdout)
        self.assertTrue(list((self.home / "custom logs").glob("renew-*.log")))

    def test_explicit_log_override_does_not_change_saved_paths(self):
        result = self.run_script("init", interactive=True, input_text=self.custom_path_answers())
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        before = (self.config / "paths.conf").read_bytes()
        (self.home / "temporary logs").mkdir()
        result = self.run_script("deploy", LOG_DIR="./temporary logs", clear_env=("CERT_DIR",))
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertTrue(list((self.home / "temporary logs").glob("deploy-*.log")))
        self.assertEqual((self.config / "paths.conf").read_bytes(), before)

    def test_changed_settings_path_does_not_overwrite_another_config(self):
        answers = self.custom_path_answers()
        other = self.home / "custom settings/settings.sh"
        other.write_text("# unrelated configuration\n", encoding="utf-8")
        before = (self.config / "settings.sh").read_bytes()
        result = self.run_script("init", interactive=True, input_text=answers)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(other.read_text(encoding="utf-8"), "# unrelated configuration\n")
        self.assertEqual((self.config / "settings.sh").read_bytes(), before)
        self.assertFalse((self.config / "paths.conf").exists())

    def test_missing_client_is_installed_into_remembered_acme_home(self):
        (self.acme_dir / "acme.sh").unlink()
        answers = self.custom_path_answers()
        (self.home / "custom acme/dnsapi").mkdir()
        result = self.run_script("init", interactive=True, input_text=answers)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertFalse((self.home / "custom acme/acme.sh").exists(), "init must not install a fresh client")
        result = self.run_script("issue", clear_env=("CERT_DIR",))
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertTrue((self.home / "custom acme/acme.sh").is_file())
        self.assertTrue((self.home / "custom installed/fullchain.pem").is_file())
        self.assertFalse((self.acme_dir / "acme.sh").exists())

    def test_nonempty_new_acme_directory_is_not_overwritten(self):
        answers = self.custom_path_answers()
        marker = self.home / "custom acme/other-data"
        marker.write_text("preserve me", encoding="utf-8")
        before = (self.config / "settings.sh").read_bytes()
        result = self.run_script("init", interactive=True, input_text=answers)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(marker.read_text(encoding="utf-8"), "preserve me")
        self.assertFalse((self.home / "custom acme/acme.sh").exists())
        self.assertFalse((self.config / "paths.conf").exists())
        self.assertEqual((self.config / "settings.sh").read_bytes(), before)

    def test_locator_cannot_be_used_as_settings_file(self):
        result = self.run_script("init", interactive=True,
                                 input_text="./.config/dev-img-acme/paths.conf\n" + "\n" * 7)
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.config / "paths.conf").exists())

    def test_log_path_with_shell_syntax_is_saved_and_loaded_literally(self):
        answers = self.custom_path_answers()
        (self.home / "logs $(touch MUST_NOT_EXIST)").mkdir()
        answers = answers.replace("./custom logs\n", "./logs $(touch MUST_NOT_EXIST)\n")
        result = self.run_script("init", interactive=True, input_text=answers)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        result = self.run_script("deploy", clear_env=("CERT_DIR",))
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertFalse((self.home / "MUST_NOT_EXIST").exists())
        self.assertTrue(list((self.home / "logs $(touch MUST_NOT_EXIST)").glob("deploy-*.log")))


if __name__ == "__main__":
    unittest.main(verbosity=2)
