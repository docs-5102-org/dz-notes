#!/usr/bin/env bash
# WSL: issue, renew and deploy Huawei DNS-01 certificates with one logged workflow.
# Usage: bash issue-cert.sh [init|issue|renew|deploy] [domain]
# 无参数：bash issue-cert.sh，等同于 issue，读取现有配置并按需引导。
# Help: bash issue-cert.sh help (also --help or -h)
# renew：读取 AK/SK，按需续期，再部署当前证书；适用于每日计划任务。
# deploy：不读取 AK/SK，不申请或续期，只重新部署已有证书。
# 两者始终非交互，都会验证部署结果，并按 RELOAD_NGINX 配置重载 Nginx。
# init remembers custom paths in ~/.config/dev-img-acme/paths.conf (no secrets).
# Without a path record, reads ~/.config/dev-img-acme/settings.sh as before.
# Optional environment: SETTINGS_FILE, ACME_HOME, CERT_DIR, DNS_SLEEP, LOG_DIR,
# RELOAD_NGINX, RELOAD_CMD, NGINX_ROOT, NGINX_PREFIX, NGINX_EXE, WINDOWS_POWERSHELL.
set -Eeuo pipefail
umask 077

usage() {
  cat <<'HELP'
用法：bash issue-cert.sh [init|issue|renew|deploy] [实际域名]
      bash issue-cert.sh
      bash issue-cert.sh help
      bash issue-cert.sh --help
      bash issue-cert.sh -h

  help、--help、-h  显示此帮助并退出，不读取配置、不进入引导或维护证书。
  init    在交互终端创建或补全配置，复用已有 AK/SK；不申请或部署证书。
  issue   首次签发并部署；配置不完整且在交互终端时自动引导，默认模式。
  renew   始终非交互；检查续期，未到期正常跳过，然后部署并重载 Nginx。
  deploy  始终非交互；仅部署已有证书并重载，不要求读取 AK/SK。
不传域名时使用 settings.sh 中的 CERT_DOMAIN；兼容旧的直接传域名方式。
方括号表示可选参数，竖线表示从中选择一个；不要把方括号或竖线原样输入。

不带任何参数时：
  bash issue-cert.sh
  等同于 bash issue-cert.sh issue，默认执行签发及部署流程，不是显示帮助。
  读取 settings.sh 中的域名、邮箱及密钥文件路径；未配置的可选项使用默认值。
  配置完整时直接执行；配置缺失或不完整时，在交互终端中自动引导补全，
  非交互环境下则报错退出。已有证书无需重新签发时正常跳过申请，继续部署。
  已有证书日常维护建议明确使用 renew；只重新部署则使用 deploy。

renew 与 deploy 的区别：
  renew   读取华为云 AK/SK，检查是否需要续期；需要时申请新证书。
          未到续期时间正常跳过申请，仍将当前证书安装到 Windows Nginx 目录。
          适用于每日自动维护：bash /root/bin/issue-cert.sh renew
  deploy  不读取 AK/SK，不请求签发或续期，只安装 acme.sh 管理的已有证书。
          适用于重新复制证书、调整部署目录后重新部署或重新加载 Nginx：
          bash /root/bin/issue-cert.sh deploy
  两者都会检查证书域名、有效期及私钥匹配，并按配置检查和重载 Nginx。
  两者始终不交互；RELOAD_NGINX=0 时只部署和验证文件，不重载。

默认配置：$HOME/.config/dev-img-acme/settings.sh
默认程序：$HOME/.acme.sh/acme.sh
默认部署：/mnt/d/SoftWare/nginx-1.12.2/conf/ssl/dev-img
默认日志：$HOME/.local/state/dev-img-acme
默认 DNS 等待：300 秒；证书机构：Let's Encrypt；插件：dns_hw。

路径交互配置：
  bash issue-cert.sh init
  可依次设置配置文件、acme.sh 安装目录、证书部署目录和日志目录。
  首次回车使用默认路径；已有设置时回车保留当前路径。
  使用 WSL 路径，例如 /root/... 或 /mnt/d/...；相对路径会保存为绝对路径。
  四个路径保存在配置文件，并记入固定的 $HOME/.config/dev-img-acme/paths.conf。
  后续 issue、renew、deploy 会自动读取，显式传入的环境变量可临时覆盖。
  init 保存配置并创建日志目录；首次安装程序和部署证书仍由 issue 执行。
  已安装 acme.sh 改到空目录时，复制完整账号及证书状态，保留原目录。
  修改日志目录的当次引导日志留在原目录，新日志目录从下次执行生效。
  变更证书部署目录后，需同步调整 Nginx 的证书路径。

默认在证书验证通过后检查并重载 Windows Nginx；不会启动已停止的 Nginx。
首次尚未配置 Nginx 时，可用 RELOAD_NGINX=0 仅安装证书文件。
RELOAD_CMD 可指定自定义重载命令；省略时使用脚本内置的 Windows Nginx 重载。
程序保留日志和失败退出码。Windows 每日任务直接调用：issue-cert.sh renew。
init 的 AK/SK 输入隐藏；已有有效密钥直接复用，修改配置前自动备份。
配置缺失时请在 WSL 终端运行 init；renew 不会等待输入或自动创建配置。
HELP
}

if [[ "${1:-}" == 'help' || "${1:-}" == '--help' || "${1:-}" == '-h' ]]; then
  usage
  exit 0
fi

ACTION=issue
case "${1:-}" in
  init|issue|renew|deploy) ACTION="$1"; shift ;;
esac

# Capture the original terminal before tee makes main's stdout a pipe.
# Keep a separate input descriptor; never read credentials from command arguments.
TASK_INTERACTIVE=0
[[ -t 0 && -t 1 ]] && TASK_INTERACTIVE=1
if [[ "$TASK_INTERACTIVE" == '1' ]]; then
  exec 8<&0
fi

for task_tool in date mkdir chmod tee; do
  if ! command -v "$task_tool" >/dev/null 2>&1; then
    printf '缺少命令 %s，请先安装基础工具后重试。\n' "$task_tool" >&2
    exit 1
  fi
done

ensure_dir() {
  [[ -d "$1" ]] || mkdir -p -- "$1"
}

# Remember only literal paths, never source or evaluate the locator file.
# Capture explicit per-run options before applying remembered defaults.
declare -A TASK_ENV_OVERRIDES=()
for task_option in SETTINGS_FILE ACME_HOME CERT_DIR LOG_DIR DNS_SLEEP RELOAD_NGINX RELOAD_CMD NGINX_ROOT NGINX_PREFIX NGINX_EXE WINDOWS_POWERSHELL; do
  if [[ -v "$task_option" ]]; then TASK_ENV_OVERRIDES["$task_option"]="${!task_option}"; fi
done
TASK_CONFIG_ROOT="$HOME/.config/dev-img-acme"
TASK_PATHS_FILE="$TASK_CONFIG_ROOT/paths.conf"
if [[ -f "$TASK_PATHS_FILE" ]]; then
  while IFS='=' read -r task_path_name task_path_value || [[ -n "$task_path_name" ]]; do
    case "$task_path_name" in
      SETTINGS_FILE|ACME_HOME|CERT_DIR|LOG_DIR)
        if [[ "$task_path_value" != /* || "$task_path_value" == *$'\r'* ]]; then
          printf '[ERROR] 路径记录格式不正确：%s\n' "$TASK_PATHS_FILE" >&2
          exit 1
        fi
        if [[ ! -v "TASK_ENV_OVERRIDES[$task_path_name]" ]]; then
          printf -v "$task_path_name" '%s' "$task_path_value"
        fi
        ;;
      ''|'#'*) ;;
      *) printf '[ERROR] 路径记录包含未知项目：%s\n' "$TASK_PATHS_FILE" >&2; exit 1 ;;
    esac
  done < "$TASK_PATHS_FILE"
fi
SETTINGS_FILE="${SETTINGS_FILE:-$TASK_CONFIG_ROOT/settings.sh}"
LOG_DIR="${LOG_DIR:-$HOME/.local/state/dev-img-acme}"
ensure_dir "$LOG_DIR"
chmod 700 "$LOG_DIR"
task_run_id="$(date '+%Y%m%d-%H%M%S')-$$"
RUN_LOG="$LOG_DIR/$ACTION-$task_run_id.log"
ACME_LOG="$LOG_DIR/acme-$ACTION-$task_run_id.log"
: > "$RUN_LOG"
: > "$ACME_LOG"
chmod 600 "$RUN_LOG" "$ACME_LOG"

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

die() {
  local task_message="$1"
  local task_status="${2:-1}"
  log "[ERROR] $task_message"
  exit "$task_status"
}

report_exit() {
  local task_status=$?
  trap - EXIT
  if [[ -n "${TASK_PENDING_FILE:-}" ]]; then
    rm -f -- "$TASK_PENDING_FILE"
  fi
  if [[ -n "${TASK_SETTINGS_TEMP:-}" ]]; then
    rm -f -- "$TASK_SETTINGS_TEMP"
  fi
  if [[ -n "${TASK_PATHS_TEMP:-}" ]]; then
    rm -f -- "$TASK_PATHS_TEMP"
  fi
  if [[ "$task_status" -ne 0 ]]; then
    log "[FAILED] 失败阶段：$STAGE；退出码：$task_status"
  fi
  log "运行日志：$RUN_LOG"
  log "acme.sh 日志：$ACME_LOG"
  exit "$task_status"
}

valid_domain() {
  local task_domain="$1" task_label
  [[ "$task_domain" != 'dev-img.example.com' && ${#task_domain} -le 253 \
    && "$task_domain" == *.* && "$task_domain" != *[!a-zA-Z0-9.-]* \
    && "$task_domain" != .* && "$task_domain" != *. && "$task_domain" != *..* ]] || return 1
  local -a task_labels
  IFS='.' read -r -a task_labels <<< "$task_domain"
  for task_label in "${task_labels[@]}"; do
    [[ ${#task_label} -le 63 && "$task_label" != -* && "$task_label" != *- ]] || return 1
  done
}

valid_email() {
  [[ "$1" != 'you@example.com' && "$1" != 'my@example.com' \
    && "$1" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]]
}

key_file_ready() {
  local task_key_value
  [[ -f "$1" && -r "$1" && -s "$1" ]] || return 1
  task_key_value="$(tr -d '\r\n' < "$1")" || return 1
  [[ -n "$task_key_value" && "$task_key_value" != *[[:space:]]* ]]
}

valid_setting() {
  case "$1" in
    CERT_DOMAIN) valid_domain "$2" ;;
    ACME_EMAIL) valid_email "$2" ;;
    HW_Region) [[ -n "$2" && "$2" != *[!a-z0-9-]* ]] ;;
    SETTINGS_FILE|ACME_HOME|CERT_DIR|LOG_DIR)
      [[ -n "$2" && "$2" != [a-zA-Z]:* && "$2" != *$'\r'* && "$2" != *$'\n'* ]] ;;
    RELOAD_NGINX) [[ "$2" == '0' || "$2" == '1' ]] ;;
  esac
}

normalize_path() {
  local task_path="$1"
  case "$task_path" in
    '~'|'$HOME'|'${HOME}') task_path="$HOME" ;;
    '~/'*) task_path="$HOME/${task_path:2}" ;;
    '$HOME/'*) task_path="$HOME/${task_path:6}" ;;
    '${HOME}/'*) task_path="$HOME/${task_path:8}" ;;
  esac
  realpath -m -- "$task_path"
}

prompt_setting() {
  local task_name="$1" task_label="$2" task_current="$3" task_answer
  while :; do
    printf '%s [%s]：' "$task_label" "$task_current"
    if ! IFS= read -r -u 8 task_answer; then
      printf '\n'
      die '输入已结束，未保存本次配置；请在 WSL 交互终端重新运行 init。'
    fi
    printf '\n'
    task_answer="${task_answer:-$task_current}"
    if valid_setting "$task_name" "$task_answer"; then
      case "$task_name" in
        SETTINGS_FILE|ACME_HOME|CERT_DIR|LOG_DIR)
          task_answer="$(normalize_path "$task_answer")" ;;
      esac
      printf -v "$task_name" '%s' "$task_answer"
      return
    fi
    log "[NOTICE] $task_label 格式不正确或仍是示例值，请重新输入。"
  done
}

prompt_key() {
  local task_name="$1" task_label="$2" task_answer
  while :; do
    printf '请输入华为云 %s（输入隐藏）：' "$task_label"
    if ! IFS= read -r -s -u 8 task_answer; then
      printf '\n'
      die '密钥输入已结束，未保存本次配置。'
    fi
    printf '\n'
    if [[ -n "$task_answer" && "$task_answer" != *[[:space:]]* ]]; then
      printf -v "$task_name" '%s' "$task_answer"
      return
    fi
    log '[NOTICE] 密钥不能为空或含空白字符，请重新输入；只填写密钥值。'
  done
}

write_key_file() {
  local task_path="$1" task_value="$2"
  ensure_dir "$(dirname "$task_path")"
  TASK_PENDING_FILE="$(mktemp -- "$task_path.tmp.XXXXXX")"
  printf '%s\n' "$task_value" > "$TASK_PENDING_FILE"
  chmod 600 "$TASK_PENDING_FILE"
  mv -f -- "$TASK_PENDING_FILE" "$task_path"
  TASK_PENDING_FILE=''
}

configuration_wizard() {
  STAGE='交互配置引导'
  [[ "$TASK_INTERACTIVE" == '1' ]] || die 'init 需要交互终端；请在 WSL 终端运行 bash issue-cert.sh init。'
  for task_tool in mktemp cp mv rm realpath ls; do
    command -v "$task_tool" >/dev/null 2>&1 || die "配置引导缺少命令：$task_tool"
  done
  log '[WIZARD] 配置引导；回车保留方括号中的值，已有有效 AK/SK 文件直接复用。'
  log '完成所有输入后保存；Ctrl+C 或输入结束将取消，尚未保存的输入不会写入配置。'
  local task_review=0 task_ak_value='' task_sk_value='' task_name task_backup
  if [[ "$ACTION" == 'init' || "$task_config_existed" == '0' ]]; then
    task_review=1
  fi
  local task_old_settings="$SETTINGS_FILE" task_old_acme="$ACME_HOME"
  if [[ "$task_review" == '1' ]]; then
    log '路径使用 WSL 格式，例如 /root/... 或 /mnt/d/...；回车保留当前值。'
    prompt_setting SETTINGS_FILE '配置文件路径' "$SETTINGS_FILE"
    prompt_setting ACME_HOME 'acme.sh 安装及账号目录' "$ACME_HOME"
    prompt_setting CERT_DIR '证书部署目录（WSL 路径）' "$CERT_DIR"
    prompt_setting LOG_DIR '日志目录' "$LOG_DIR"
  fi
  CERT_DOMAIN="$DOMAIN"
  if [[ "$task_review" == '1' ]] || ! valid_domain "$CERT_DOMAIN"; then
    prompt_setting CERT_DOMAIN '证书完整域名（不含 https://）' "$CERT_DOMAIN"
  fi
  if [[ "$task_review" == '1' ]] || ! valid_email "${ACME_EMAIL:-}"; then
    prompt_setting ACME_EMAIL 'ACME 联系邮箱' "${ACME_EMAIL:-}"
  fi
  if [[ "$task_review" == '1' ]] || ! valid_setting HW_Region "$HW_Region"; then
    prompt_setting HW_Region '华为云 API 区域' "$HW_Region"
  fi
  if [[ "$task_review" != '1' ]] && ! valid_setting CERT_DIR "$CERT_DIR"; then
    prompt_setting CERT_DIR '证书部署目录（WSL 路径）' "$CERT_DIR"
  fi
  if [[ "$task_review" == '1' ]] || ! valid_setting RELOAD_NGINX "$RELOAD_NGINX"; then
    log '重载 Nginx：1=检查并重载，0=仅部署文件；首次尚未配置站点时选 0。'
    prompt_setting RELOAD_NGINX '是否重载 Nginx（0/1）' "$RELOAD_NGINX"
  fi
  log "AK 文件：$HW_AK_FILE"
  if key_file_ready "$HW_AK_FILE"; then
    log '复用已有 AK 文件。'
  else
    prompt_key task_ak_value AK
  fi
  log "SK 文件：$HW_SK_FILE"
  if key_file_ready "$HW_SK_FILE"; then
    log '复用已有 SK 文件。'
  else
    prompt_key task_sk_value SK
  fi
  [[ "$HW_AK_FILE" != "$HW_SK_FILE" ]] || die 'AK 和 SK 必须使用不同的文件路径。'
  task_old_settings="$(normalize_path "$task_old_settings")"
  task_old_acme="$(normalize_path "$task_old_acme")"
  # Partial auto-guides still persist normalized paths for future discovery.
  for task_name in SETTINGS_FILE ACME_HOME CERT_DIR LOG_DIR; do
    printf -v "$task_name" '%s' "$(normalize_path "${!task_name}")"
  done
  [[ "$SETTINGS_FILE" != "$(normalize_path "$TASK_PATHS_FILE")" && "$SETTINGS_FILE" != */renew.lock ]] \
    || die '配置文件不能使用路径记录文件或维护锁的路径。'
  if [[ "$SETTINGS_FILE" != "$task_old_settings" && -e "$SETTINGS_FILE" ]]; then
    die "目标配置文件已存在，为避免覆盖已取消保存：$SETTINGS_FILE；请另选路径。"
  fi
  # Preserve existing account/certificate state when relocating to an empty home.
  if [[ "$ACME_HOME" != "$task_old_acme" && -x "$task_old_acme/acme.sh" && ! -x "$ACME_HOME/acme.sh" ]]; then
    [[ "$ACME_HOME/" != "$task_old_acme/"* && "$task_old_acme/" != "$ACME_HOME/"* ]] \
      || die '新的 acme.sh 目录不能与原目录互相包含，请使用独立目录。'
    if [[ -e "$ACME_HOME" ]]; then
      [[ -d "$ACME_HOME" && -z "$(ls -A -- "$ACME_HOME")" ]] \
        || die "新的 acme.sh 目录非空且没有可执行程序，未覆盖：$ACME_HOME"
    fi
    ensure_dir "$ACME_HOME"
    chmod 700 "$ACME_HOME"
    cp -a -- "$task_old_acme/." "$ACME_HOME/"
    log "已复制完整 acme.sh 账号及证书状态到：$ACME_HOME；原目录保留。"
  fi
  ensure_dir "$(dirname "$SETTINGS_FILE")"
  ensure_dir "$LOG_DIR"
  chmod 700 "$LOG_DIR"
  # Collect all input before modifying credentials or settings. %q keeps paths
  # and email addresses literal when settings.sh is sourced on the next run.
  if [[ -f "$task_old_settings" ]]; then
    task_backup="$task_old_settings.bak-$task_run_id"
    cp -- "$task_old_settings" "$task_backup"
    chmod 600 "$task_backup"
    log "原配置备份：$task_backup"
  fi
  TASK_SETTINGS_TEMP="$(mktemp -- "$SETTINGS_FILE.tmp.XXXXXX")"
  if [[ -f "$task_old_settings" ]]; then
    cat -- "$task_old_settings" > "$TASK_SETTINGS_TEMP"
  fi
  {
    printf '\n# issue-cert.sh init: %s; existing custom settings above are preserved.\n' "$task_run_id"
    for task_name in SETTINGS_FILE ACME_HOME CERT_DIR LOG_DIR CERT_DOMAIN ACME_EMAIL HW_Region HW_AK_FILE HW_SK_FILE RELOAD_NGINX; do
      printf '%s=%q\n' "$task_name" "${!task_name}"
    done
  } >> "$TASK_SETTINGS_TEMP"
  chmod 600 "$TASK_SETTINGS_TEMP"
  # The settings file becomes visible only after the credential writes succeed.
  if [[ -n "$task_ak_value" ]]; then write_key_file "$HW_AK_FILE" "$task_ak_value"; fi
  if [[ -n "$task_sk_value" ]]; then write_key_file "$HW_SK_FILE" "$task_sk_value"; fi
  mv -f -- "$TASK_SETTINGS_TEMP" "$SETTINGS_FILE"
  TASK_SETTINGS_TEMP=''
  TASK_PATHS_TEMP="$(mktemp -- "$TASK_PATHS_FILE.tmp.XXXXXX")"
  for task_name in SETTINGS_FILE ACME_HOME CERT_DIR LOG_DIR; do
    printf '%s=%s\n' "$task_name" "${!task_name}"
  done > "$TASK_PATHS_TEMP"
  chmod 600 "$TASK_PATHS_TEMP"
  mv -f -- "$TASK_PATHS_TEMP" "$TASK_PATHS_FILE"
  TASK_PATHS_TEMP=''
  ACME="$ACME_HOME/acme.sh"
  DOMAIN="$CERT_DOMAIN"
  log "[CONFIGURED] 配置已保存：$SETTINGS_FILE"
  log "域名：$DOMAIN；区域：$HW_Region；证书目录：$CERT_DIR；重载 Nginx：$RELOAD_NGINX"
  log "路径已记住：$TASK_PATHS_FILE；后续运行无需重复传入路径。"
  log "程序目录：$ACME_HOME；日志目录：$LOG_DIR"
  log '本次引导日志仍写入启动时的日志目录；新的日志目录从下次执行生效。'
  log 'AK/SK 未输出到日志。修改已有有效密钥时，请单独更新对应密钥文件。'
}

run_acme() {
  "$ACME" --home "$ACME_HOME" --log "$ACME_LOG" --log-level 2 "$@"
}

reload_nginx() {
  if [[ "$RELOAD_NGINX" == '0' ]]; then
    log '[NOTICE] RELOAD_NGINX=0，本次仅部署证书；将该选项改为 1 后执行 deploy 可检查并重载 Nginx。'
    return
  fi
  STAGE='重载 Nginx'
  if [[ -n "$RELOAD_CMD" ]]; then
    log '执行自定义 Nginx 重载命令。'
    /bin/bash -c "$RELOAD_CMD"
    log '[RELOADED] 自定义重载命令执行成功。'
    return
  fi
  local task_nginx_root="${NGINX_ROOT:-/mnt/d/SoftWare/nginx-1.12.2}"
  local task_nginx_exe="${NGINX_EXE:-$task_nginx_root/nginx.exe}"
  local task_nginx_prefix="${NGINX_PREFIX:-D:/SoftWare/nginx-1.12.2/}"
  local task_ps="${WINDOWS_POWERSHELL:-/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe}"
  [[ -x "$task_nginx_exe" ]] || die "找不到 Windows Nginx：$task_nginx_exe"
  [[ -x "$task_ps" ]] || die "无法调用 Windows PowerShell：$task_ps；请检查 WSL 互操作设置。"
  STAGE='检查 Nginx 配置'
  log '检查 Windows Nginx 配置，检查成功后才会请求重载。'
  "$task_nginx_exe" -p "$task_nginx_prefix" -c conf/nginx.conf -t
  local task_process_status=0
  "$task_ps" -NoProfile -NonInteractive -Command \
    'if (Get-Process -Name nginx -ErrorAction SilentlyContinue) { exit 0 } else { exit 2 }' \
    || task_process_status=$?
  case "$task_process_status" in
    0)
      STAGE='重载 Nginx'
      "$task_nginx_exe" -p "$task_nginx_prefix" -c conf/nginx.conf -s reload
      log '[RELOADED] Nginx 重载请求成功；可重新连接 HTTPS 检查实际证书。'
      ;;
    2) log '[NOTICE] Nginx 当前未运行，已部署证书；下次启动时会读取新证书。' ;;
    *) die '无法检查 Windows Nginx 运行状态。' "$task_process_status" ;;
  esac
}

main() {
  STAGE='读取配置'
  trap report_exit EXIT
  log '[1/6] 读取本机配置'
  [[ "$#" -le 1 ]] || die '只支持一个域名参数，使用 --help 查看用法。'
  local task_config_existed=0 task_lock_status=0
  if [[ -f "$SETTINGS_FILE" ]]; then
    task_config_existed=1
    [[ -r "$SETTINGS_FILE" ]] || die "无法读取配置文件：$SETTINGS_FILE"
  elif [[ "$ACTION" != 'init' && !( "$ACTION" == 'issue' && "$TASK_INTERACTIVE" == '1' ) ]]; then
    die "找不到配置文件：$SETTINGS_FILE；请在 WSL 交互终端执行 bash issue-cert.sh init；$ACTION 不会等待输入。"
  fi
  [[ "$ACTION" != 'init' || "$TASK_INTERACTIVE" == '1' ]] || die 'init 需要交互终端，请在 WSL 终端运行。'
  for task_tool in flock dirname tr bash; do
    command -v "$task_tool" >/dev/null 2>&1 || die "缺少命令：$task_tool；flock 可通过 apt-get install -y util-linux 安装。"
  done
  if [[ ! -d "$TASK_CONFIG_ROOT" ]]; then
    ensure_dir "$TASK_CONFIG_ROOT"
    chmod 700 "$TASK_CONFIG_ROOT"
  fi
  exec 9>"$TASK_CONFIG_ROOT/renew.lock"
  flock -n 9 || task_lock_status=$?
  case "$task_lock_status" in
    0) ;;
    1) log '[SKIPPED] 已有证书维护任务正在运行，本次正常退出。'; return 0 ;;
    *) die '无法获取证书维护锁。' "$task_lock_status" ;;
  esac
  if [[ "$task_config_existed" == '1' ]]; then
    bash -n "$SETTINGS_FILE"
    local task_option task_loaded_settings="$SETTINGS_FILE"
    # This is the user's local shell configuration, not a downloaded credential file.
    source "$SETTINGS_FILE"
    # Explicit per-run environment options still override saved wizard defaults.
    for task_option in "${!TASK_ENV_OVERRIDES[@]}"; do
      printf -v "$task_option" '%s' "${TASK_ENV_OVERRIDES[$task_option]}"
    done
    SETTINGS_FILE="$task_loaded_settings"
  fi
  # Keep settings from the original lego-based document working after migration.
  HW_AK_FILE="${HW_AK_FILE:-${HUAWEICLOUD_ACCESS_KEY_ID_FILE:-$HOME/.config/dev-img-acme/huawei-ak}}"
  HW_SK_FILE="${HW_SK_FILE:-${HUAWEICLOUD_SECRET_ACCESS_KEY_FILE:-$HOME/.config/dev-img-acme/huawei-sk}}"
  HW_Region="${HW_Region:-${HUAWEICLOUD_REGION:-cn-north-4}}"
  DOMAIN="${1:-${CERT_DOMAIN:-}}"
  ACME_HOME="${ACME_HOME:-$HOME/.acme.sh}"
  ACME="$ACME_HOME/acme.sh"
  CERT_DIR="${CERT_DIR:-/mnt/d/SoftWare/nginx-1.12.2/conf/ssl/dev-img}"
  DNS_SLEEP="${DNS_SLEEP:-300}"
  [[ "$DNS_SLEEP" =~ ^[0-9]+$ ]] || die 'DNS_SLEEP 必须为非负整数秒数。'
  if [[ "$task_config_existed" == '0' ]]; then
    RELOAD_NGINX="${RELOAD_NGINX:-0}"
  else
    RELOAD_NGINX="${RELOAD_NGINX:-1}"
  fi
  RELOAD_CMD="${RELOAD_CMD:-}"
  if [[ "$ACTION" == 'init' ]]; then
    configuration_wizard
    log '配置完成；可执行 issue 首次签发，已有证书可执行 deploy 或 renew。'
    return 0
  fi
  if [[ "$ACTION" == 'issue' && "$TASK_INTERACTIVE" == '1' ]]; then
    if [[ "$task_config_existed" == '0' ]] || ! valid_domain "$DOMAIN" \
      || ! valid_email "${ACME_EMAIL:-}" || ! key_file_ready "$HW_AK_FILE" || ! key_file_ready "$HW_SK_FILE" \
      || ! valid_setting HW_Region "$HW_Region" || ! valid_setting RELOAD_NGINX "$RELOAD_NGINX"; then
      configuration_wizard
    fi
  fi
  [[ "$RELOAD_NGINX" == '0' || "$RELOAD_NGINX" == '1' ]] || die 'RELOAD_NGINX 只能为 0 或 1；请在 WSL 终端执行 init。'
  valid_domain "$DOMAIN" || die '域名缺失、仍为示例值或格式不正确；请在 WSL 终端执行 init，填写不带协议、端口或路径的实际域名。'
  if [[ "$ACTION" == 'issue' ]]; then
    valid_email "${ACME_EMAIL:-}" || die 'ACME_EMAIL 缺失、仍为示例值或格式不正确；请在 WSL 终端执行 init。'
  fi
  log "执行模式：$ACTION"
  log "目标域名：$DOMAIN；证书机构：Let's Encrypt；DNS 插件：dns_hw"
  log "配置文件：$SETTINGS_FILE"
  log "证书目录：$CERT_DIR"

  STAGE='检查依赖和 AK/SK 文件'
  log '[2/6] 检查依赖与华为云 AK/SK（不输出密钥内容）'
  for task_tool in tr openssl bash; do
    command -v "$task_tool" >/dev/null 2>&1 || die "缺少命令：$task_tool；请先安装依赖。"
  done
  if [[ "$ACTION" != 'deploy' ]]; then
    log "AK 文件路径：$HW_AK_FILE"
    log "SK 文件路径：$HW_SK_FILE"
    [[ -f "$HW_AK_FILE" && -r "$HW_AK_FILE" && -s "$HW_AK_FILE" ]] \
      || die "AK 文件不存在、不可读或为空：$HW_AK_FILE；请在 WSL 终端执行 init 补全，续期不会等待输入。"
    [[ -f "$HW_SK_FILE" && -r "$HW_SK_FILE" && -s "$HW_SK_FILE" ]] \
      || die "SK 文件不存在、不可读或为空：$HW_SK_FILE；请在 WSL 终端执行 init 补全，续期不会等待输入。"
    HW_AK="$(tr -d '\r\n' < "$HW_AK_FILE")"
    HW_SK="$(tr -d '\r\n' < "$HW_SK_FILE")"
    [[ -n "$HW_AK" && -n "$HW_SK" ]] || die 'AK 或 SK 文件去除换行后为空，请填写实际值。'
    [[ "$HW_AK" != *[[:space:]]* && "$HW_SK" != *[[:space:]]* ]] \
      || die 'AK 或 SK 含空白字符，请检查复制内容。'
    export HW_AK HW_SK
    export HW_Region="${HW_Region:-${HUAWEICLOUD_REGION:-cn-north-4}}"
    log "AK/SK 文件已加载；华为云区域：$HW_Region"
  else
    log 'deploy 仅部署已有证书，跳过 DNS 凭证读取。'
  fi

  STAGE='安装或检查 acme.sh'
  log '[3/6] 安装或检查 acme.sh 与 dns_hw 插件'
  if [[ ! -x "$ACME" ]]; then
    [[ "$ACTION" == 'issue' ]] || die '未安装 acme.sh，请先执行 issue 完成首次签发；续期不会自动创建新的证书状态。'
    log "尚未安装 acme.sh，正在从 https://get.acme.sh 安装到 $ACME_HOME"
    if command -v curl >/dev/null 2>&1; then
      curl -fsSL https://get.acme.sh | sh -s "email=$ACME_EMAIL" --home "$ACME_HOME" --nocron
    elif command -v wget >/dev/null 2>&1; then
      wget -O - https://get.acme.sh | sh -s "email=$ACME_EMAIL" --home "$ACME_HOME" --nocron
    else
      die '未找到 curl 或 wget，请先执行 apt-get install -y curl。'
    fi
  else
    log "使用已有程序：$ACME"
  fi
  [[ -x "$ACME" ]] || die "安装后仍未找到可执行程序：$ACME；请检查上面的下载和安装日志。"
  if [[ "$ACTION" != 'deploy' ]]; then
    [[ -f "$ACME_HOME/dnsapi/dns_hw.sh" ]] \
      || die '当前版本缺少 dns_hw.sh，请按指南第 4.2 节更新 acme.sh，不能改用账号密码插件代替。'
  fi
  run_acme --version

  STAGE='注册或检查 ACME 账号'
  if [[ "$ACTION" == 'issue' ]]; then
    log "[4/6] 注册或检查 Let's Encrypt 账号"
    run_acme --register-account --server letsencrypt -m "$ACME_EMAIL"
  else
    log '[4/6] 使用已有 ACME 账号和证书状态，不重新注册账号。'
  fi

  STAGE='签发或续期证书'
  local task_acme_status=0
  case "$ACTION" in
    issue)
      log "[5/6] 开始 DNS-01 签发，将等待 TXT 生效 $DNS_SLEEP 秒；此阶段请勿关闭终端"
      run_acme --issue --server letsencrypt --dns dns_hw -d "$DOMAIN" \
        --keylength 2048 --dnssleep "$DNS_SLEEP" || task_acme_status=$?
      ;;
    renew)
      log '[5/6] 检查证书是否需要续期；未到期正常跳过，不使用 --force。'
      run_acme --renew --server letsencrypt -d "$DOMAIN" || task_acme_status=$?
      ;;
    deploy) log '[5/6] 仅部署已有证书，跳过签发与续期。' ;;
  esac
  case "$task_acme_status" in
    0) log '证书维护命令执行成功。' ;;
    2) log '[SKIPPED] 当前证书无需重新签发或续期，继续检查部署；不是失败。' ;;
    *) die "acme.sh $ACTION 执行失败，返回码 $task_acme_status；请查看日志。" "$task_acme_status" ;;
  esac

  STAGE='安装和验证证书'
  log '[6/6] 安装证书到 Windows Nginx 目录并验证'
  ensure_dir "$CERT_DIR"
  local -a task_install_args=(--install-cert -d "$DOMAIN"
    --key-file "$CERT_DIR/privkey.pem" --fullchain-file "$CERT_DIR/fullchain.pem"
    --reloadcmd '')
  # The unified workflow reloads after validation; clear previously saved helper hooks.
  run_acme "${task_install_args[@]}"
  [[ -s "$CERT_DIR/fullchain.pem" && -s "$CERT_DIR/privkey.pem" ]] \
    || die '安装命令执行完毕，但目标证书或私钥文件不存在或为空。'
  openssl x509 -in "$CERT_DIR/fullchain.pem" -noout -checkhost "$DOMAIN"
  openssl x509 -in "$CERT_DIR/fullchain.pem" -noout -checkend 0
  local task_cert_pub task_key_pub
  task_cert_pub="$(openssl x509 -in "$CERT_DIR/fullchain.pem" -pubkey -noout \
    | openssl pkey -pubin -outform DER | openssl dgst -sha256)"
  task_key_pub="$(openssl pkey -in "$CERT_DIR/privkey.pem" -pubout -outform DER \
    | openssl dgst -sha256)"
  [[ "$task_cert_pub" == "$task_key_pub" ]] || die '安装的证书与私钥不匹配。'
  openssl x509 -in "$CERT_DIR/fullchain.pem" -noout -subject -issuer -dates
  reload_nginx
  log '[SUCCESS] 证书文件已安装，域名、有效期和私钥匹配检查通过。'
  log "完整证书链：$CERT_DIR/fullchain.pem"
  log "私钥文件：$CERT_DIR/privkey.pem"
  log 'HTTPS 图片是否可访问，仍需按指南验证 DNS、Nginx 配置和防火墙。'
}

# Keep live output and the transcript, while preserving the actual failure status.
set +e
(
  set -Eeuo pipefail
  main "$@"
) 2>&1 | tee -a "$RUN_LOG"
task_pipeline_status=("${PIPESTATUS[@]}")
if [[ "${task_pipeline_status[0]}" -ne 0 ]]; then
  exit "${task_pipeline_status[0]}"
fi
if [[ "${task_pipeline_status[1]}" -ne 0 ]]; then
  printf '[FAILED] 日志写入失败：%s\n' "$RUN_LOG" >&2
  exit "${task_pipeline_status[1]}"
fi
exit 0
