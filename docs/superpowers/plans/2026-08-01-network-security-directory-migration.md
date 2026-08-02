# Network Security Directory Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 将 `content/docs/network-security` 按基础知识、信息收集、代理、流量分析、逆向工程、渗透测试和恶意软件主题重新组织，并保持 Fumadocs 导航和 MDX 解析正常。

**Architecture:** 先建立可验证的旧路径到新路径映射，再分主题移动现有 MDX 文件并为每个新目录创建 `index.mdx` 与 `meta.json`。最后统一更新根导航和全仓库内部链接，删除经过验证为空的旧目录，并以结构检查和 `pnpm.cmd types:check` 作为完成标准。

**Tech Stack:** MDX、JSON、Fumadocs、Next.js、PowerShell、pnpm

## Global Constraints

- 公共资源继续使用现有 `/assets/...` 路径，不迁移 `public/assets`。
- 不保留旧目录中的重复 MDX 文件，也不新增旧路径重定向。
- 每个实际文档目录必须包含 `index.mdx` 和 `meta.json`。
- 所有新建 `index.mdx` 使用 `title: 概览`，并补齐 `subTitle`、`description` 和 `category`。
- 本次只调整结构、导航、文件名和必要的 MDX 元数据，不重写文章技术内容。
- 保留工作区中与 `content/docs/network-security` 无关的现有修改。
- 不运行完整生产构建；使用结构检查和 `pnpm.cmd types:check` 验证。

---

### Task 1: 建立迁移前基线

**Files:**
- Read: `content/docs/network-security/**/*.mdx`
- Read: `content/docs/network-security/**/meta.json`
- Read: `content/docs/**/*.mdx`

**Interfaces:**
- Consumes: 已批准的设计规格 `docs/superpowers/specs/2026-08-01-network-security-directory-design.md`
- Produces: 迁移源文件存在性、旧路径引用和 VuePress 旧语法的基线结果

- [x] **Step 1: 验证所有迁移源文件存在**

使用 PowerShell 构造设计规格中的源路径数组，对每个路径执行 `Test-Path -LiteralPath`；任何缺失路径都终止迁移。

- [x] **Step 2: 扫描旧内部链接**

运行：

```powershell
Get-ChildItem -LiteralPath content -Recurse -Filter '*.mdx' -File |
  Select-String -Pattern '/docs/network-security/(information-gathering-and-tools|comprehensive-knowledge|reverse-engineering/)'
```

记录所有需要更新的文件和行号。

- [x] **Step 3: 扫描 VuePress 和不兼容 JSX 语法**

运行：

```powershell
Get-ChildItem -LiteralPath content/docs/network-security -Recurse -Filter '*.mdx' -File |
  Select-String -Pattern '\$withBase|:href=|:src=|v-bind:|<br>|style="'
```

预期：如果存在命中，则在对应文件迁移任务中一并修复。

### Task 2: 迁移网络安全基础目录

**Files:**
- Move: `content/docs/network-security/comprehensive-knowledge/index.mdx` → `content/docs/network-security/fundamentals/index.mdx`
- Move: `content/docs/network-security/comprehensive-knowledge/meta.json` → `content/docs/network-security/fundamentals/meta.json`
- Modify: `content/docs/network-security/fundamentals/index.mdx`
- Modify: `content/docs/network-security/fundamentals/meta.json`

**Interfaces:**
- Consumes: `comprehensive-knowledge` 现有简介与参考资源
- Produces: `/docs/network-security/fundamentals` 导航入口

- [x] **Step 1: 创建目标目录并移动文件**

创建 `fundamentals`，然后使用精确的 `Move-Item -LiteralPath` 移动两个文件。

- [x] **Step 2: 更新基础知识目录页**

将 frontmatter 和正文统一为：

```mdx
---
title: 概览
subTitle: 网络安全基础
description: 整理网络安全基础概念、通用方法与学习资源。
category:
  - 网络安全
---

# 网络安全基础

这里整理网络安全基础概念、通用方法和跨主题学习资源。

## 学习资源

- [翻墙 GFW 用户为什么会被抓到？](https://www.youtube.com/watch?v=r5_XFK6UBGs&ab_channel=%E6%97%A7%E9%87%91%E5%B1%B1%E7%86%8A%E6%8A%A5)
```

- [x] **Step 3: 更新基础知识元数据**

`fundamentals/meta.json` 内容：

```json
{
  "title": "网络安全基础",
  "pages": ["index"]
}
```

- [x] **Step 4: 验证目录可解析**

使用 `ConvertFrom-Json` 解析 `fundamentals/meta.json`，并确认 `index.mdx` 包含 `subTitle: 网络安全基础`。

### Task 3: 迁移信息收集、爬虫和接码文档

**Files:**
- Create: `content/docs/network-security/reconnaissance/index.mdx`
- Create: `content/docs/network-security/reconnaissance/meta.json`
- Create: `content/docs/network-security/reconnaissance/crawler/index.mdx`
- Create: `content/docs/network-security/reconnaissance/crawler/meta.json`
- Create: `content/docs/network-security/reconnaissance/verification-services/index.mdx`
- Create: `content/docs/network-security/reconnaissance/verification-services/meta.json`
- Move/Rename: `bilili.mdx` → `reconnaissance/crawler/bilibili.mdx`
- Move/Rename: `douyin-bandan-simple1.mdx` → `reconnaissance/crawler/douyin-ranking-api.mdx`
- Move/Rename: `learn.mdx` → `reconnaissance/crawler/douyin-kuaishou-resources.mdx`
- Move/Rename: `chrome-query-event.mdx` → `reconnaissance/crawler/chrome-event-listener.mdx`
- Move: `code-reception.mdx` → `reconnaissance/verification-services/code-reception.mdx`

**Interfaces:**
- Consumes: 五篇现有文章正文和旧 `crawler/index.mdx` 中的文章标题
- Produces: `/docs/network-security/reconnaissance`、`/crawler`、`/verification-services` 三层导航

- [x] **Step 1: 创建三个目标目录**

创建 `reconnaissance`、`reconnaissance/crawler`、`reconnaissance/verification-services`。

- [x] **Step 2: 精确移动并重命名五篇文档**

对照 Files 列表逐项执行 `Move-Item -LiteralPath`，每次移动前确认目标不存在。

- [x] **Step 3: 创建信息收集总览**

总览包含“子目录”分组，并链接：

```mdx
- [网页爬虫与数据采集](/docs/network-security/reconnaissance/crawler)
- [接码与身份验证服务](/docs/network-security/reconnaissance/verification-services)
```

- [x] **Step 4: 创建爬虫目录页和元数据**

`crawler/meta.json` 的页面顺序为：

```json
{
  "title": "网页爬虫与数据采集",
  "pages": [
    "index",
    "bilibili",
    "douyin-ranking-api",
    "douyin-kuaishou-resources",
    "chrome-event-listener"
  ]
}
```

目录页按相同顺序列出四篇文章。

- [x] **Step 5: 创建接码目录页和元数据**

`verification-services/meta.json` 的页面顺序为 `index`、`code-reception`，目录页链接“国外接码平台”。

- [x] **Step 6: 更新迁移文章中的路径元数据**

保持文章技术正文不变；仅修复指向旧站内路径的链接、旧 VuePress 语法和不兼容 JSX 标签。

### Task 4: 迁移代理与匿名网络文档

**Files:**
- Create: `content/docs/network-security/proxy-and-anonymity/index.mdx`
- Create: `content/docs/network-security/proxy-and-anonymity/meta.json`
- Move/Rename: `information-gathering-and-tools/proxy.mdx` → `proxy-and-anonymity/proxy-tools.mdx`
- Move: `information-gathering-and-tools/socks5-vs-http.mdx` → `proxy-and-anonymity/socks5-vs-http.mdx`
- Move: `information-gathering-and-tools/socks5-http-https.mdx` → `proxy-and-anonymity/socks5-http-https.mdx`

**Interfaces:**
- Consumes: 三篇代理文章
- Produces: `/docs/network-security/proxy-and-anonymity` 导航

- [x] **Step 1: 创建目录并移动三篇文档**

创建目标目录，并按 Files 列表精确移动。

- [x] **Step 2: 创建目录页**

目录页按以下顺序链接文章：代理检测与 IP 测速工具、SOCKS5 代理与 HTTP 代理对比、SOCKS5/HTTP/HTTPS 代理对比。

- [x] **Step 3: 创建元数据**

```json
{
  "title": "代理与匿名网络",
  "pages": ["index", "proxy-tools", "socks5-vs-http", "socks5-http-https"]
}
```

### Task 5: 迁移流量分析与抓包文档

**Files:**
- Create: `content/docs/network-security/traffic-analysis/index.mdx`
- Create: `content/docs/network-security/traffic-analysis/meta.json`
- Move/Rename: `information-gathering-and-tools/crawler/tools.mdx` → `traffic-analysis/packet-capture-tools.mdx`
- Move/Rename: `information-gathering-and-tools/crawler/android7-unknown-solution.mdx` → `traffic-analysis/android-ca-capture.mdx`

**Interfaces:**
- Consumes: 抓包工具对比、Android 7+ CA 抓包文章和旧目录中的模拟器资源链接
- Produces: `/docs/network-security/traffic-analysis` 导航

- [x] **Step 1: 创建目录并移动两篇文档**

创建目标目录，并使用精确源路径和目标路径移动文件。

- [x] **Step 2: 创建流量分析目录页**

目录页包含：

```mdx
## 文档

- [抓包与网络分析工具对比](/docs/network-security/traffic-analysis/packet-capture-tools)
- [Android 7+ 绕过 CA 限制抓取 HTTPS](/docs/network-security/traffic-analysis/android-ca-capture)

## 模拟器与环境

- [夜神安卓模拟器如何设置代理](https://support.yeshen.com/zh-CN/qt/szdl)
- [MuMu 抓包攻略](/assets/_resources/crawler/HTTP_Toolkit_MuMu抓包攻略.docx)
```

- [x] **Step 3: 创建元数据**

```json
{
  "title": "流量分析与抓包",
  "pages": ["index", "packet-capture-tools", "android-ca-capture"]
}
```

### Task 6: 细分逆向工程目录

**Files:**
- Create: `content/docs/network-security/reverse-engineering/mobile/index.mdx`
- Create: `content/docs/network-security/reverse-engineering/mobile/meta.json`
- Create: `content/docs/network-security/reverse-engineering/web-and-api/index.mdx`
- Create: `content/docs/network-security/reverse-engineering/web-and-api/meta.json`
- Create: `content/docs/network-security/reverse-engineering/mini-program/index.mdx`
- Create: `content/docs/network-security/reverse-engineering/mini-program/meta.json`
- Modify: `content/docs/network-security/reverse-engineering/index.mdx`
- Modify: `content/docs/network-security/reverse-engineering/meta.json`
- Move: `android-tuoke.mdx`, `frida.mdx` → `mobile/`
- Move: `baidu-ai-tts-analyze.mdx`, `douyin-creator-analyze.mdx` → `web-and-api/`
- Move/Rename: `douyin-upload-analzye.mdx` → `web-and-api/douyin-upload-analyze.mdx`
- Move/Rename: `xhs-web-analze.mdx` → `web-and-api/xiaohongshu-web-analyze.mdx`
- Move/Rename: `mp-car-analyze.mdx` → `mini-program/automotive-mini-program-analyze.mdx`

**Interfaces:**
- Consumes: 七篇逆向工程文章
- Produces: 移动端、Web/API、小程序三个子目录

- [x] **Step 1: 创建三个子目录并移动文章**

逐项验证源存在、目标不存在后执行精确移动。

- [x] **Step 2: 创建移动端目录导航**

页面顺序：`index`、`android-tuoke`、`frida`。

- [x] **Step 3: 创建 Web 与 API 目录导航**

页面顺序：`index`、`baidu-ai-tts-analyze`、`douyin-creator-analyze`、`douyin-upload-analyze`、`xiaohongshu-web-analyze`。

- [x] **Step 4: 创建小程序目录导航**

页面顺序：`index`、`automotive-mini-program-analyze`。

- [x] **Step 5: 更新逆向工程总览与元数据**

总览只展示三个子目录；`reverse-engineering/meta.json` 页面顺序为 `index`、`mobile`、`web-and-api`、`mini-program`。

### Task 7: 更新网络安全根导航和全仓库链接

**Files:**
- Modify: `content/docs/network-security/index.mdx`
- Modify: `content/docs/network-security/meta.json`
- Move: `content/docs/network-security/malicious-software-and-phishing/` → `content/docs/network-security/malware-and-phishing/`
- Modify: any MDX/TS/TSX/JSON file containing an old internal documentation route

**Interfaces:**
- Consumes: Tasks 2–6 产生的最终目录和路由
- Produces: 完整的侧边栏顺序和无旧路径的站内导航

- [x] **Step 1: 重命名恶意软件目录**

验证旧目录存在且新目录不存在后，将 `malicious-software-and-phishing` 精确重命名为 `malware-and-phishing`。

- [x] **Step 2: 更新根目录页**

补充 `subTitle: 网络安全`，将 H1 改为“网络安全”，并按目标顺序列出七个主题目录。

- [x] **Step 3: 更新根元数据**

```json
{
  "title": "网络安全",
  "root": true,
  "pages": [
    "index",
    "fundamentals",
    "reconnaissance",
    "proxy-and-anonymity",
    "traffic-analysis",
    "reverse-engineering",
    "penetration-testing",
    "malware-and-phishing"
  ]
}
```

- [x] **Step 4: 更新站内旧路由**

基于 Task 1 的扫描结果逐项替换，覆盖：

- `/docs/network-security/comprehensive-knowledge`
- `/docs/network-security/information-gathering-and-tools/...`
- `/docs/network-security/reverse-engineering/<article>`
- `/docs/network-security/malicious-software-and-phishing`
- 拼写错误的 `analzye`、`analze` 路径

- [x] **Step 5: 再次扫描旧路由**

运行与 Task 1 Step 2 相同的扫描，并额外检查旧文件名；预期零命中。

### Task 8: 清理旧空目录并验证结果

**Files:**
- Remove after replacement validation: `content/docs/network-security/information-gathering-and-tools/index.mdx`
- Remove after replacement validation: `content/docs/network-security/information-gathering-and-tools/meta.json`
- Remove after replacement validation: `content/docs/network-security/information-gathering-and-tools/crawler/index.mdx`
- Remove after replacement validation: `content/docs/network-security/information-gathering-and-tools/crawler/meta.json`
- Remove after empty-directory validation: `content/docs/network-security/comprehensive-knowledge/`
- Remove after empty-directory validation: `content/docs/network-security/information-gathering-and-tools/crawler/`
- Remove after empty-directory validation: `content/docs/network-security/information-gathering-and-tools/`
- Validate: `content/docs/network-security/**/*.mdx`
- Validate: `content/docs/network-security/**/meta.json`

**Interfaces:**
- Consumes: 完成全部移动和链接更新后的目录树
- Produces: 无残留旧目录、可被 Fumadocs 解析的最终结构

- [x] **Step 1: 验证并移除已被新导航替代的旧导航文件**

确认四个旧导航文件的精确路径与文件类型，并确认 Tasks 3–5 已创建对应的新目录页和元数据；随后只移除这四个已被替代的文件。

- [x] **Step 2: 验证旧目录为空**

对三个精确路径分别解析绝对路径，确认都位于 `content/docs/network-security` 内、不是重解析点，并确认递归文件数为零。

- [x] **Step 3: 删除已验证为空的旧目录**

只对 Step 1 验证通过的三个精确路径执行 `Remove-Item -LiteralPath`；任何目录非空都停止而不删除。

- [x] **Step 4: 验证每个目录具备导航文件**

遍历 `content/docs/network-security` 下的实际目录，确认每个目录都包含 `index.mdx` 和 `meta.json`。

- [x] **Step 5: 验证所有 meta 页面存在**

使用 `ConvertFrom-Json` 解析所有 `meta.json`，并逐项验证 `pages` 中对应的 `.mdx` 文件或子目录存在。

- [x] **Step 6: 扫描 MDX 旧语法**

```powershell
Get-ChildItem -LiteralPath content/docs/network-security -Recurse -Filter '*.mdx' -File |
  Select-String -Pattern '\$withBase|:href=|:src=|v-bind:|<br>|style="'
```

预期：零命中。

- [x] **Step 7: 运行 MDX 和 TypeScript 校验**

运行：

```powershell
pnpm.cmd types:check
```

预期：`fumadocs-mdx`、`next typegen` 和 `tsc --noEmit` 均成功，进程退出码为 0。

- [x] **Step 8: 检查工作区差异**

运行 `git status --short` 和限定到 `content/docs/network-security` 的差异检查，确认没有修改无关文件，也没有遗漏迁移源文件。

