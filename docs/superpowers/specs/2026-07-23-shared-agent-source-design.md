# 共享 Agent 单一源设计

## 背景

工程当前包含以下 Agent 配置：

- `.claude/agents/mdx-agent.md`
- `.codex/agents/mdx-agent.toml`
- 空的 `.agents` 目录

Claude 与 Codex 使用不同配置格式。当前两份配置内容重复，修改规则时容易遗漏其中一份；README 也仍然只引用 Claude 配置。

## 目标

- `.agents/mdx-agent.md` 成为 MDX Agent 的唯一人工维护源文件。
- Claude 和 Codex 继续从各自约定的目录读取可直接使用的配置。
- 通过一个确定性同步脚本生成客户端配置。
- 提供同步检查，及时发现生成文件与源文件不一致。
- README 只把 `.agents/mdx-agent.md` 作为规则入口，并说明同步方式。

## 非目标

- 不增加 Cursor、Gemini、GitHub Copilot 或其他客户端配置。
- 不改变 MDX Agent 已有的工作职责和规则。
- 不使用符号链接；Codex 的 TOML 格式与 Markdown 源文件不兼容，且符号链接在 Windows 与 Git 环境中的行为不够稳定。
- 不引入新的第三方依赖。

## 文件结构

```text
.agents/
└── mdx-agent.md                 # 唯一人工维护源
.claude/
└── agents/
    └── mdx-agent.md             # 自动生成
.codex/
├── README.md
└── agents/
    └── mdx-agent.toml           # 自动生成
scripts/
└── sync-agents.mjs              # 同步与检查脚本
```

## 唯一源格式

`.agents/mdx-agent.md` 延用现有 Claude Agent 的 Markdown 结构：

```yaml
---
name: mdx-agent
description: ...
tools: Read, Grep, Glob, Bash, Write
---
```

frontmatter 后的 Markdown 正文是共享的 Agent 指令。`name` 和 `description` 同时用于生成 Codex TOML；`tools` 仅用于 Claude 配置，Codex 输出不使用该字段。

## 生成规则

### Claude

生成 `.claude/agents/mdx-agent.md`：

- 保留源文件的 frontmatter 和 Markdown 正文。
- 在 YAML frontmatter 之后加入自动生成提示，明确禁止直接编辑，同时保证 frontmatter 仍位于文件首部。
- 输出使用 UTF-8 无 BOM，换行符保持确定性。

### Codex

生成 `.codex/agents/mdx-agent.toml`：

- `name` 来自源文件 frontmatter。
- `description` 来自源文件 frontmatter。
- `developer_instructions` 使用完整 Markdown 正文。
- 使用经过完整转义的 TOML 基本字符串保存字段，避免正文中的引号、反斜杠或换行破坏配置。
- 在文件顶部加入自动生成注释。
- 输出使用 UTF-8 无 BOM。

## 同步命令

在 `package.json` 中提供：

```json
{
  "scripts": {
    "agents:sync": "node scripts/sync-agents.mjs",
    "agents:check": "node scripts/sync-agents.mjs --check"
  }
}
```

- `pnpm agents:sync`：从唯一源重新生成 Claude 与 Codex 配置。
- `pnpm agents:check`：只比较预期内容，不写文件；不一致时输出目标文件并以非零状态退出。

## 数据流

```text
.agents/mdx-agent.md
        │
        ▼
scripts/sync-agents.mjs
        ├──▶ .claude/agents/mdx-agent.md
        └──▶ .codex/agents/mdx-agent.toml
```

人工修改只发生在 `.agents/mdx-agent.md`。生成脚本负责所有格式差异，客户端目录中的文件不作为反向输入。

## 错误处理

同步脚本遇到以下情况时应停止并给出明确错误：

- 唯一源文件不存在。
- frontmatter 缺失或未闭合。
- `name` 或 `description` 缺失。
- 传入未知命令参数。
- `--check` 模式发现目标文件缺失或内容漂移。

脚本只写入两个明确的生成目标，不扫描或覆盖其他 Agent 文件。

## README 调整

- 关键目录说明中将 `.claude/agents` 改为 `.agents`，说明它是共享 Agent 唯一源。
- “MDX Agent 规则”链接改为 `.agents/mdx-agent.md`。
- 开发建议改为优先遵循 `.agents/mdx-agent.md`。
- 增加 `pnpm agents:sync` 和 `pnpm agents:check` 的简短说明。

## 验证

实施完成后执行：

1. `pnpm agents:sync`
2. `pnpm agents:check`
3. 再次执行 `pnpm agents:sync` 并确认 Git diff 不发生变化，验证生成的幂等性。
4. 检查三个配置中的名称、描述和正文一致。
5. 检查三个文件均为 UTF-8 无 BOM。

## 兼容与维护约束

- 生成文件继续提交到 Git，使 Claude 和 Codex 克隆仓库后无需先执行同步即可发现 Agent。
- 修改共享规则后，提交前运行 `pnpm agents:sync`。
- CI 暂不扩展；`agents:check` 可在后续按需加入现有 CI。
