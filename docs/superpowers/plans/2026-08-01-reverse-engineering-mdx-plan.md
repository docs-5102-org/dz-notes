# 逆向工程文档 MDX 整理实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 统一 `content/docs/network/reverse-engineering` 下文档的 MDX frontmatter 与语法，并整理目录索引。

**Architecture:** 保留现有文章文件名和路由，在每篇文章头部补充标题及 `网络/逆向工程` 分类；`index.mdx` 只承担目录介绍和合规资源导航；`meta.json` 维护稳定的页面顺序。

**Tech Stack:** Fumadocs、MDX、YAML frontmatter、JSON。

## Global Constraints

- 所有文章的 `category` 统一为 `网络`、`逆向工程`。
- 不修改文章路由文件名，避免已有链接失效。
- 清理与主题无关或具有明显破解/入侵导向的索引内容。
- 本次只做内容整理，不新增测试文件。

### Task 1: 统一文章 frontmatter 与 MDX 语法

**Files:**
- Modify: `content/docs/network/reverse-engineering/android-tuoke.mdx`
- Modify: `content/docs/network/reverse-engineering/baidu-ai-tts-analyze.mdx`
- Modify: `content/docs/network/reverse-engineering/douyin-creator-analyze.mdx`
- Modify: `content/docs/network/reverse-engineering/douyin-upload-analzye.mdx`
- Modify: `content/docs/network/reverse-engineering/frida.mdx`
- Modify: `content/docs/network/reverse-engineering/mp-car-analyze.mdx`
- Modify: `content/docs/network/reverse-engineering/xhs-web-analze.mdx`

- [x] 为每篇文章补充 `title`、`description`、`category` frontmatter。
- [x] 修复裸 HTML、未转义字符、链接和代码围栏等 MDX 语法问题。

### Task 2: 优化目录入口

**Files:**
- Modify: `content/docs/network/reverse-engineering/index.mdx`
- Modify: `content/docs/network/reverse-engineering/meta.json`

- [x] 按主题重写目录说明和文章列表。
- [x] 保留合规的学习资源，移除破解、入侵等不适合作为目录内容的链接。
- [x] 使 `meta.json` 页面顺序与实际文章文件一致。

### Task 3: 内容一致性核对

- [x] 检查所有文章 frontmatter 均包含 `title` 和 `category`。
- [x] 检查 `meta.json` 中每个页面均对应实际文件。
- [x] 检查修改范围仅限目标目录及本计划文件。
