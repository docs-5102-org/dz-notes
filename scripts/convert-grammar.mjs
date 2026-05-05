

/**
 * 将 TextMate YAML grammar 转换为 Shiki 可用的 JSON grammar。
 *
 * 依赖：
 * - js-yaml
 *
 * 用法：
 * - 本地文件：
 *   node scripts/convert-grammar.mjs <input.tmLanguage> [output.tmLanguage.json]
 *
 * - 远程 URL：
 *   node scripts/convert-grammar.mjs <raw-url> [output.tmLanguage.json]
 *
 * 示例：
 * - node scripts/convert-grammar.mjs plantuml.tmLanguage
 * - node scripts/convert-grammar.mjs plantuml.tmLanguage grammars/plantuml.tmLanguage.json
 * - node scripts/convert-grammar.mjs https://raw.githubusercontent.com/qjebbs/vscode-plantuml/master/syntaxes/plantuml.yaml-tmLanguage grammars/plantuml.tmLanguage.json
 *
 * 注意：
 * - 远程地址必须使用 GitHub Raw 地址，不能直接使用 github.com 的页面地址。
 * - 如果未传输出路径，脚本会默认在当前目录生成同名 `.json` 文件。
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const [,, inputArg, outputArg] = process.argv;

if (!inputArg) {
  console.error('❌ 缺少输入文件参数');
  console.error('用法: node scripts/convert-grammar.mjs <input 或 URL> [output.json]');
  process.exit(1);
}

// ── 读取内容：本地文件 or 远程 URL ────────────────────
async function readInput(input) {
  if (input.startsWith('http://') || input.startsWith('https://')) {
    console.log(`🌐 正在下载：${input}`);
    const res = await fetch(input);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    return await res.text();
  }

  const filePath = path.resolve(input);
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在：${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

// ── 推断输出文件名 ─────────────────────────────────────
function resolveOutputPath(input, outputArg) {
  if (outputArg) return path.resolve(outputArg);

  // 从 URL 或文件路径里取文件名
  const basename = path.basename(input.split('?')[0]); // 去掉 query string
  return path.resolve(basename + '.json');
}

// ── 主流程 ─────────────────────────────────────────────
try {
  const yamlContent = await readInput(inputArg);
  const jsonContent = yaml.load(yamlContent);

  const outputFile = resolveOutputPath(inputArg, outputArg);
  const outputDir = path.dirname(outputFile);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 已创建目录：${outputDir}`);
  }

  fs.writeFileSync(outputFile, JSON.stringify(jsonContent, null, 2), 'utf-8');

  console.log(`✅ 转换完成`);
  console.log(`   输出：${outputFile}`);
} catch (err) {
  console.error(`❌ 失败：${err.message}`);
  process.exit(1);
}
