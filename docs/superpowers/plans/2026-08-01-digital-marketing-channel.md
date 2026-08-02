# Digital Marketing Channel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 新建可在站点频道导航中访问的“数字营销”文档频道，并为用户提供的全部目录节点创建 `index.mdx` 和 `meta.json`。

**Architecture:** 使用 `content/docs/digital-marketing` 作为频道根目录，根 `meta.json` 使用 `root: true`；每个目录页只承担简介和子目录导航。顶层 `content/docs/meta.json`、频道映射和旧频道列表同步登记 `digital-marketing`，使桌面与移动端频道导航保持一致。

**Tech Stack:** MDX、JSON、Fumadocs、Next.js、PowerShell、pnpm

## Global Constraints

- 频道 slug 固定为 `digital-marketing`，页面路由以 `/docs/digital-marketing` 开头。
- 每个目录必须包含 `index.mdx` 和 `meta.json`，所有目录页均使用 `title: 概览` 和非空 `subTitle`。
- `meta.json` 中 `pages` 先放 `index`，随后按用户给出的树形顺序列出子目录。
- 本次只创建目录和导航页，不创建虚构的项目文章或外部链接。
- 不修改现有频道目录和公共资源。

---

### Task 1: 注册数字营销频道

**Files:**
- Modify: `content/docs/meta.json`
- Modify: `src/lib/doc-channels.ts`
- Modify: `src/lib/site-old.ts`

**Interfaces:**
- Produces: `digital-marketing` 出现在所有频道选择器中，标题为“数字营销”。

- [x] 将 `digital-marketing` 加入 `content/docs/meta.json`，位置在 `media-creator` 和 `network-security` 之间。
- [x] 在 `doc-channels.ts` 的颜色、标题、描述和排序映射中加入 `digital-marketing`；排序值为 `151.5`。
- [x] 在 `site-old.ts` 的频道列表中加入 `digital-marketing`，路由为 `/docs/digital-marketing`。

### Task 2: 创建频道根目录和一级分类

**Files:**
- Create: `content/docs/digital-marketing/index.mdx`
- Create: `content/docs/digital-marketing/meta.json`
- Create: 每个一级目录的 `index.mdx` 和 `meta.json`

**Interfaces:**
- Produces: 工作室项目、广告联盟、流量变现、网赚项目、引流五个一级入口。

- [x] 创建频道根和五个一级目录。
- [x] 为根目录和一级目录生成符合 MDX 规范的标题、简介和导航页。
- [x] 为每个一级目录创建与页面导航顺序一致的 `meta.json`。

### Task 3: 创建网赚项目完整子树

**Files:**
- Create: `content/docs/digital-marketing/online-income-projects/**/index.mdx`
- Create: `content/docs/digital-marketing/online-income-projects/**/meta.json`

**Interfaces:**
- Produces: 内容站项目、拉新与地推、引流脚本、微信公众号推广，以及电影采集站、小说项目等完整层级。

- [x] 按用户树创建内容站项目、电影采集站、小说项目、其他内容站目录及其叶子目录。
- [x] 按用户树创建拉新与地推及首码网聚推君、无忧赚、任推邦目录。
- [x] 为每个节点生成导航页和元数据，保留用户输入的中文主题作为 `subTitle` 和侧边栏标题。

目录 slug 固定为：`content-sites`、`movie-content-sites`、`novel-projects`、`other-content-sites`、`user-acquisition-and-offline-promotion`、`shoumawang-jutuijun`、`wuyouzhuan`、`rentuibang`、`lead-generation-scripts` 和 `wechat-official-account-promotion`。

### Task 4: 验证目录与 MDX 生成

**Files:**
- Validate: `content/docs/digital-marketing/**`
- Validate: `content/docs/meta.json`
- Validate: `src/lib/doc-channels.ts`
- Validate: `src/lib/site-old.ts`

**Interfaces:**
- Consumes: Tasks 1–3 的频道配置和目录文件。
- Produces: 可解析的 Fumadocs 频道结构。

- [x] 验证每个数字营销目录都包含 `index.mdx` 和 `meta.json`。
- [x] 解析所有新建 `meta.json`，确认每个 `pages` 条目指向存在的文件或子目录。
- [x] 扫描新频道，确认不存在 `$withBase`、`:href=`、`:src=`、`v-bind:` 或非自闭合 `<br>`。
- [x] 运行 `pnpm.cmd types:check`，确认 MDX 生成、路由类型生成和 TypeScript 检查通过。

