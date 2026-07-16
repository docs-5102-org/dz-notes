# Codex Workspace Rules

## 编码约束

- 仓库中的源码和文档默认保持为 `UTF-8` 无 BOM，除非某个文件本身就有明确的特殊编码要求。
- 本仓库曾出现 `mock/data/activity.js` 被 PowerShell 误写成 `UTF-8 with BOM` 的问题，后续编辑时要避免再次发生。
- 在 PowerShell 中读取源码、文档、配置文件时，默认显式指定 `UTF-8` 编码，例如：`Get-Content -LiteralPath 'docs\frd\wode-design.md' -TotalCount 140 -Encoding utf8`；不要依赖 PowerShell 默认编码。
- 不要对 JS、Vue、MD 等源码文件使用 Windows PowerShell 5.x 的 `Set-Content -Encoding utf8`，因为它会写入 BOM。
- 如果必须通过脚本写回文件，统一使用 `.NET` 的 `System.Text.UTF8Encoding($false)`，确保输出为 `UTF-8` 无 BOM。
- 如果怀疑文件编码异常，先检查文件头字节；`EF BB BF` 表示文件带有 BOM。
