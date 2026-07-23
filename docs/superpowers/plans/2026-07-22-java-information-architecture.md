# Java Information Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Move every Java note into the approved domain-oriented directory structure, make URLs and navigation metadata match that structure, and verify that no document or resource is lost.

**Architecture:** The migration is a content-preserving filesystem reorganization under `content/docs/languages/java`. Six new domain directories own top-level navigation, existing technology directories move intact beneath them, and a recursive Node test validates the navigation graph and migration inventory. Absolute documentation URLs and the three path-sensitive tests are updated after the move.

**Tech Stack:** Fumadocs MDX, JSON navigation metadata, Node.js `node:test`, PowerShell, TypeScript/Next.js validation through `npm.cmd run types:check`.

## Global Constraints

- Use English kebab-case for physical directory names and URL segments.
- Use concise Chinese titles for domain navigation.
- Every domain directory and `font-processing` must contain both `index.mdx` and `meta.json`.
- Do not retain redirects or compatibility pages for old Java URLs.
- Preserve all existing article text, assets, and uncommitted user edits.
- Do not stage or commit migrated Java files automatically because the worktree already contains user-owned Java changes.
- The final Java tree must contain 250 MDX files, 41 JSON files, and 4 non-MDX/JSON assets.

---

## File Structure

**Create**

- `tests/java-doc-structure.test.mjs`: validates the approved directory map, inventory, `meta.json` targets, and removal of legacy first-level paths.
- `content/docs/languages/java/core-foundations/{index.mdx,meta.json}`: core-language domain landing page and navigation.
- `content/docs/languages/java/template-engines/{index.mdx,meta.json}`: template-engine landing page and navigation.
- `content/docs/languages/java/persistence-frameworks/{index.mdx,meta.json}`: persistence landing page and navigation.
- `content/docs/languages/java/web-frameworks/{index.mdx,meta.json}`: web-framework landing page and navigation.
- `content/docs/languages/java/web-containers/{index.mdx,meta.json}`: web-container landing page and navigation.
- `content/docs/languages/java/engineering-ecosystem/{index.mdx,meta.json}`: engineering/ecosystem landing page and navigation.
- `content/docs/languages/java/engineering-ecosystem/font-processing/{index.mdx,meta.json}`: font-processing landing page and navigation.

**Move without rewriting article bodies**

- `content/docs/languages/java/intro.mdx` → `content/docs/languages/java/learning-resources.mdx`.
- The 22 existing technology directories move according to the mapping in Task 2.
- `content/docs/languages/java/ttf.mdx` → `content/docs/languages/java/engineering-ecosystem/font-processing/ttf-fonts.mdx`.

**Modify**

- `content/docs/languages/java/meta.json`: declares only the overview, learning resources, and six domains.
- `content/docs/languages/java/index.mdx`: links to the new domain landing pages.
- All moved `index.mdx` files containing `/docs/languages/java/...`: replace old URL prefixes with new prefixes.
- Navigation titles in the moved `meta.json` files listed in Task 4.
- `tests/ve-starter-mdx.test.mjs`, `tests/spring-boot-version-intro-mdx.test.mjs`, and `tests/foreign-phone-mdx.test.mjs`: point at moved documents.
- `docs/superpowers/specs/2026-07-16-unified-keyword-search-design.md`: point example Spring Boot URLs at their new location.

### Task 1: Add a failing Java structure acceptance test

**Files:**

- Create: `tests/java-doc-structure.test.mjs`

**Interfaces:**

- Consumes: the Java content tree rooted at `content/docs/languages/java`.
- Produces: a Node test that asserts the approved directory contract and can be rerun after every migration task.

- [x] **Step 1: Create the acceptance test**

Add `tests/java-doc-structure.test.mjs` with this complete content:

```js
import assert from 'node:assert/strict';
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const javaRoot = fileURLToPath(
  new URL('../content/docs/languages/java/', import.meta.url),
);

const expectedDomains = {
  'core-foundations': [
    'index',
    'jvm',
    'java-8',
    'concurrent-programming',
    'annotations',
    'regular-expressions',
  ],
  'template-engines': ['index', 'freemarker', 'thymeleaf', 'velocity'],
  'persistence-frameworks': ['index', 'jpa', 'hibernate', 'mybatis'],
  'web-frameworks': [
    'index',
    'struts2',
    'spring',
    'spring-boot',
    'spring-cloud',
    'spring-webflux',
  ],
  'web-containers': ['index', 'tomcat', 'resin'],
  'engineering-ecosystem': [
    'index',
    'logging',
    'scheduling',
    'security-frameworks',
    'crawler-frameworks',
    'font-processing',
  ],
};

const legacyEntries = [
  'annotation',
  'crawler',
  'freemarker',
  'hibernate',
  'java-concurrent',
  'java8-tutorial',
  'jpa',
  'jvm',
  'log',
  'mybatis',
  'regex',
  'resin',
  'schedule',
  'security-framework',
  'spring',
  'spring-boot',
  'spring-cloud',
  'spring-web-flux',
  'struts2',
  'thymeleaf',
  'tomcat',
  'velocity',
  'intro.mdx',
  'ttf.mdx',
];

function walkFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(target) : [target];
  });
}

function resolveMetaEntry(directory, entry) {
  const page = join(directory, `${entry}.mdx`);
  const child = join(directory, entry);
  if (existsSync(page)) return page;
  if (existsSync(child) && statSync(child).isDirectory()) return child;
  return null;
}

test('Java documentation uses the approved domain structure', () => {
  const rootMeta = JSON.parse(
    readFileSync(join(javaRoot, 'meta.json'), 'utf8'),
  );

  assert.deepEqual(rootMeta.pages, [
    'index',
    'learning-resources',
    'core-foundations',
    'template-engines',
    'persistence-frameworks',
    'web-frameworks',
    'web-containers',
    'engineering-ecosystem',
  ]);

  for (const [domain, pages] of Object.entries(expectedDomains)) {
    const directory = join(javaRoot, domain);
    const meta = JSON.parse(readFileSync(join(directory, 'meta.json'), 'utf8'));
    assert.deepEqual(meta.pages, pages, `${domain}/meta.json page order`);
    assert.ok(existsSync(join(directory, 'index.mdx')), `${domain} index`);
  }

  const fontDirectory = join(javaRoot, 'engineering-ecosystem', 'font-processing');
  const fontMeta = JSON.parse(
    readFileSync(join(fontDirectory, 'meta.json'), 'utf8'),
  );
  assert.deepEqual(fontMeta.pages, ['index', 'ttf-fonts']);

  for (const entry of legacyEntries) {
    assert.equal(existsSync(join(javaRoot, entry)), false, `legacy ${entry}`);
  }
});

test('every Java meta page points to an existing page or directory', () => {
  const files = walkFiles(javaRoot);
  const metaFiles = files.filter((file) => file.endsWith('meta.json'));

  for (const metaFile of metaFiles) {
    const directory = fileURLToPath(new URL('.', `file:///${metaFile.replaceAll('\\', '/')}`));
    const meta = JSON.parse(readFileSync(metaFile, 'utf8'));
    for (const entry of meta.pages ?? []) {
      assert.ok(
        resolveMetaEntry(directory, entry),
        `${metaFile}: missing ${entry}`,
      );
    }
  }
});

test('Spring overview links follow its meta page order', () => {
  const springDirectory = join(javaRoot, 'web-frameworks', 'spring');
  const springMeta = JSON.parse(
    readFileSync(join(springDirectory, 'meta.json'), 'utf8'),
  );
  const springIndex = readFileSync(join(springDirectory, 'index.mdx'), 'utf8');
  const articleSlugs = [
    ...springIndex.matchAll(
      /\]\(\/docs\/languages\/java\/web-frameworks\/spring\/([^)]+)\)/g,
    ),
  ].map((match) => match[1]);

  assert.deepEqual(articleSlugs, springMeta.pages.slice(1));
});

test('Java migration preserves the complete content inventory', () => {
  const files = walkFiles(javaRoot);
  const count = (extension) =>
    files.filter((file) => extname(file) === extension).length;

  assert.equal(count('.mdx'), 250);
  assert.equal(count('.json'), 41);
  assert.equal(files.length - count('.mdx') - count('.json'), 4);
});
```

- [x] **Step 2: Run the new test and confirm it fails before migration**

Run:

```powershell
node --test tests/java-doc-structure.test.mjs
```

Expected: FAIL because `core-foundations/meta.json` and the other new domain files do not exist yet.

### Task 2: Move existing Java content into the approved directories

**Files:**

- Move: the 22 existing technology directories, `intro.mdx`, and `ttf.mdx`.
- Create as move destinations: the six domain directories and `engineering-ecosystem/font-processing`.

**Interfaces:**

- Consumes: every existing Java document and asset at its current location.
- Produces: the approved physical paths while preserving file contents and uncommitted edits.

- [x] **Step 1: Verify every source and resolved destination is inside the Java root**

Run this read-only PowerShell check:

```powershell
$javaRoot = (Resolve-Path 'content\docs\languages\java').Path
$sources = @(
  'annotation','crawler','freemarker','hibernate','java-concurrent',
  'java8-tutorial','jpa','jvm','log','mybatis','regex','resin','schedule',
  'security-framework','spring','spring-boot','spring-cloud',
  'spring-web-flux','struts2','thymeleaf','tomcat','velocity'
)
$sources | ForEach-Object {
  $resolved = (Resolve-Path (Join-Path $javaRoot $_)).Path
  if (-not $resolved.StartsWith($javaRoot + '\')) { throw "Outside Java root: $resolved" }
  $resolved
}
```

Expected: exactly 22 resolved directories, all beginning with the absolute Java root.

- [x] **Step 2: Create the verified destination directories**

Run:

```powershell
$javaRoot = (Resolve-Path 'content\docs\languages\java').Path
@(
  'core-foundations',
  'template-engines',
  'persistence-frameworks',
  'web-frameworks',
  'web-containers',
  'engineering-ecosystem',
  'engineering-ecosystem\font-processing'
) | ForEach-Object {
  $target = [System.IO.Path]::GetFullPath((Join-Path $javaRoot $_))
  if (-not $target.StartsWith($javaRoot + '\')) { throw "Outside Java root: $target" }
  New-Item -ItemType Directory -Path $target -Force | Out-Null
}
```

Expected: seven destination directories exist under the Java root.

- [x] **Step 3: Move all directories and rename the two root documents**

Run these explicit moves from the repository root:

```powershell
Move-Item 'content\docs\languages\java\jvm' 'content\docs\languages\java\core-foundations\jvm'
Move-Item 'content\docs\languages\java\java8-tutorial' 'content\docs\languages\java\core-foundations\java-8'
Move-Item 'content\docs\languages\java\java-concurrent' 'content\docs\languages\java\core-foundations\concurrent-programming'
Move-Item 'content\docs\languages\java\annotation' 'content\docs\languages\java\core-foundations\annotations'
Move-Item 'content\docs\languages\java\regex' 'content\docs\languages\java\core-foundations\regular-expressions'
Move-Item 'content\docs\languages\java\freemarker' 'content\docs\languages\java\template-engines\freemarker'
Move-Item 'content\docs\languages\java\thymeleaf' 'content\docs\languages\java\template-engines\thymeleaf'
Move-Item 'content\docs\languages\java\velocity' 'content\docs\languages\java\template-engines\velocity'
Move-Item 'content\docs\languages\java\jpa' 'content\docs\languages\java\persistence-frameworks\jpa'
Move-Item 'content\docs\languages\java\hibernate' 'content\docs\languages\java\persistence-frameworks\hibernate'
Move-Item 'content\docs\languages\java\mybatis' 'content\docs\languages\java\persistence-frameworks\mybatis'
Move-Item 'content\docs\languages\java\struts2' 'content\docs\languages\java\web-frameworks\struts2'
Move-Item 'content\docs\languages\java\spring' 'content\docs\languages\java\web-frameworks\spring'
Move-Item 'content\docs\languages\java\spring-boot' 'content\docs\languages\java\web-frameworks\spring-boot'
Move-Item 'content\docs\languages\java\spring-cloud' 'content\docs\languages\java\web-frameworks\spring-cloud'
Move-Item 'content\docs\languages\java\spring-web-flux' 'content\docs\languages\java\web-frameworks\spring-webflux'
Move-Item 'content\docs\languages\java\tomcat' 'content\docs\languages\java\web-containers\tomcat'
Move-Item 'content\docs\languages\java\resin' 'content\docs\languages\java\web-containers\resin'
Move-Item 'content\docs\languages\java\log' 'content\docs\languages\java\engineering-ecosystem\logging'
Move-Item 'content\docs\languages\java\schedule' 'content\docs\languages\java\engineering-ecosystem\scheduling'
Move-Item 'content\docs\languages\java\security-framework' 'content\docs\languages\java\engineering-ecosystem\security-frameworks'
Move-Item 'content\docs\languages\java\crawler' 'content\docs\languages\java\engineering-ecosystem\crawler-frameworks'
Move-Item 'content\docs\languages\java\intro.mdx' 'content\docs\languages\java\learning-resources.mdx'
Move-Item 'content\docs\languages\java\ttf.mdx' 'content\docs\languages\java\engineering-ecosystem\font-processing\ttf-fonts.mdx'
```

Expected: the Java root contains only `index.mdx`, `learning-resources.mdx`, `meta.json`, and the six approved domain directories.

- [x] **Step 4: Confirm moved files retain the pre-migration inventory**

Run:

```powershell
$files = Get-ChildItem 'content\docs\languages\java' -Recurse -File
"MDX=$(@($files | Where-Object Extension -eq '.mdx').Count)"
"JSON=$(@($files | Where-Object Extension -eq '.json').Count)"
"ASSETS=$(@($files | Where-Object Extension -notin @('.mdx','.json')).Count)"
```

Expected before adding new landing pages: `MDX=243`, `JSON=34`, `ASSETS=4`.

### Task 3: Build root and domain navigation

**Files:**

- Modify: `content/docs/languages/java/meta.json`
- Modify: `content/docs/languages/java/index.mdx`
- Create: the 14 domain/font navigation files listed under File Structure.

**Interfaces:**

- Consumes: the physical directory layout from Task 2.
- Produces: a complete clickable navigation hierarchy whose declared child order matches the approved design.

- [x] **Step 1: Replace the Java root navigation**

Set `content/docs/languages/java/meta.json` to:

```json
{
  "title": "Java",
  "pages": [
    "index",
    "learning-resources",
    "core-foundations",
    "template-engines",
    "persistence-frameworks",
    "web-frameworks",
    "web-containers",
    "engineering-ecosystem"
  ]
}
```

Set `content/docs/languages/java/index.mdx` to:

```mdx
---
title: 概览
subTitle: Java
description: Java 语言、框架与工程实践笔记
---

# Java

这里整理 Java 核心基础、后端框架、Web 容器与工程生态相关的学习资料和实践笔记。

## 学习资源

- [Java 基础教程参考资料汇总](/docs/languages/java/learning-resources)

## 主题目录

- [核心基础](/docs/languages/java/core-foundations)
- [模板引擎](/docs/languages/java/template-engines)
- [持久层框架](/docs/languages/java/persistence-frameworks)
- [Web 框架](/docs/languages/java/web-frameworks)
- [Web 容器](/docs/languages/java/web-containers)
- [工程与生态](/docs/languages/java/engineering-ecosystem)
```

- [x] **Step 2: Create the six domain `meta.json` files**

Use these exact objects:

```json
// core-foundations/meta.json
{"title":"核心基础","pages":["index","jvm","java-8","concurrent-programming","annotations","regular-expressions"]}

// template-engines/meta.json
{"title":"模板引擎","pages":["index","freemarker","thymeleaf","velocity"]}

// persistence-frameworks/meta.json
{"title":"持久层框架","pages":["index","jpa","hibernate","mybatis"]}

// web-frameworks/meta.json
{"title":"Web 框架","pages":["index","struts2","spring","spring-boot","spring-cloud","spring-webflux"]}

// web-containers/meta.json
{"title":"Web 容器","pages":["index","tomcat","resin"]}

// engineering-ecosystem/meta.json
{"title":"工程与生态","pages":["index","logging","scheduling","security-frameworks","crawler-frameworks","font-processing"]}
```

Format each file with two-space indentation and a trailing newline.

- [x] **Step 3: Create the six domain `index.mdx` files**

Each file uses this exact body with its listed frontmatter and links:

```mdx
<!-- core-foundations/index.mdx -->
---
title: 概览
subTitle: 核心基础
description: JVM、Java 8、并发编程与语言基础专题
---

# 核心基础

这里整理 Java 运行机制、语言特性和通用基础能力。

## 子目录

- [JVM](/docs/languages/java/core-foundations/jvm)
- [Java 8](/docs/languages/java/core-foundations/java-8)
- [并发编程](/docs/languages/java/core-foundations/concurrent-programming)
- [注解](/docs/languages/java/core-foundations/annotations)
- [正则表达式](/docs/languages/java/core-foundations/regular-expressions)
```

```mdx
<!-- template-engines/index.mdx -->
---
title: 概览
subTitle: 模板引擎
description: Java 服务端模板引擎笔记
---

# 模板引擎

这里整理 Java Web 开发中常用的服务端模板引擎。

## 子目录

- [FreeMarker](/docs/languages/java/template-engines/freemarker)
- [Thymeleaf](/docs/languages/java/template-engines/thymeleaf)
- [Velocity](/docs/languages/java/template-engines/velocity)
```

```mdx
<!-- persistence-frameworks/index.mdx -->
---
title: 概览
subTitle: 持久层框架
description: Java 数据持久化规范与框架笔记
---

# 持久层框架

这里整理 Java 数据访问、对象关系映射和 SQL 映射相关内容。

## 子目录

- [JPA](/docs/languages/java/persistence-frameworks/jpa)
- [Hibernate](/docs/languages/java/persistence-frameworks/hibernate)
- [MyBatis](/docs/languages/java/persistence-frameworks/mybatis)
```

```mdx
<!-- web-frameworks/index.mdx -->
---
title: 概览
subTitle: Web 框架
description: Java Web 与微服务框架笔记
---

# Web 框架

这里整理 Java Web、响应式应用和微服务开发框架。

## 子目录

- [Struts2](/docs/languages/java/web-frameworks/struts2)
- [Spring](/docs/languages/java/web-frameworks/spring)
- [Spring Boot](/docs/languages/java/web-frameworks/spring-boot)
- [Spring Cloud](/docs/languages/java/web-frameworks/spring-cloud)
- [Spring WebFlux](/docs/languages/java/web-frameworks/spring-webflux)
```

```mdx
<!-- web-containers/index.mdx -->
---
title: 概览
subTitle: Web 容器
description: Java Web 容器配置与运维笔记
---

# Web 容器

这里整理 Java Web 容器的安装、配置、部署与集群实践。

## 子目录

- [Tomcat](/docs/languages/java/web-containers/tomcat)
- [Resin](/docs/languages/java/web-containers/resin)
```

```mdx
<!-- engineering-ecosystem/index.mdx -->
---
title: 概览
subTitle: 工程与生态
description: Java 工程能力与应用框架笔记
---

# 工程与生态

这里整理日志、任务调度、安全认证、数据采集和字体处理等工程专题。

## 子目录

- [日志](/docs/languages/java/engineering-ecosystem/logging)
- [定时任务](/docs/languages/java/engineering-ecosystem/scheduling)
- [安全认证框架](/docs/languages/java/engineering-ecosystem/security-frameworks)
- [爬虫框架](/docs/languages/java/engineering-ecosystem/crawler-frameworks)
- [字体处理](/docs/languages/java/engineering-ecosystem/font-processing)
```

- [x] **Step 4: Create font-processing navigation**

Set `content/docs/languages/java/engineering-ecosystem/font-processing/meta.json` to:

```json
{
  "title": "字体处理",
  "pages": [
    "index",
    "ttf-fonts"
  ]
}
```

Set `content/docs/languages/java/engineering-ecosystem/font-processing/index.mdx` to:

```mdx
---
title: 概览
subTitle: 字体处理
description: Java 字体加载、处理与部署实践
---

# 字体处理

这里整理 Java 应用中的字体文件加载、处理和部署相关内容。

## 文档

- [TTF 字体](/docs/languages/java/engineering-ecosystem/font-processing/ttf-fonts)
```

- [x] **Step 5: Run the structure test and confirm navigation now passes**

Run:

```powershell
node --test tests/java-doc-structure.test.mjs
```

Expected: all four tests PASS.

### Task 4: Normalize technology navigation and replace old paths

**Files:**

- Modify: moved technology `meta.json` titles for concurrency, annotations, regular expressions, logging, scheduling, security, and crawler topics.
- Modify: `core-foundations/concurrent-programming/queue/meta.json` and `core-foundations/concurrent-programming/thread/thread-group/meta.json` to remove stale `"1"` entries that do not resolve to pages.
- Modify: every moved Java `index.mdx` containing an old absolute Java URL.
- Modify: the three path-sensitive tests and the unified-search design example.

**Interfaces:**

- Consumes: the new physical directory tree and navigation pages from Tasks 2–3.
- Produces: consistent Chinese navigation names and active links that all resolve to the new URLs.

- [x] **Step 1: Update seven technology navigation titles**

Change only the `title` property in these files; preserve their existing `pages` arrays exactly:

```text
core-foundations/concurrent-programming/meta.json: Java Concurrent → 并发编程
core-foundations/annotations/meta.json: Annotation → 注解
core-foundations/regular-expressions/meta.json: Regex → 正则表达式
engineering-ecosystem/logging/meta.json: Log → 日志
engineering-ecosystem/scheduling/meta.json: Schedule → 定时任务
engineering-ecosystem/security-frameworks/meta.json: Security Framework → 安全认证框架
engineering-ecosystem/crawler-frameworks/meta.json: Crawler → 爬虫框架
```

Also remove the final `"1"` item from the `pages` arrays in `queue/meta.json` and `thread/thread-group/meta.json`; both entries predate this migration and have no matching document or directory.

- [x] **Step 2: Update matching technology overview copy**

In the seven corresponding `index.mdx` files, change `subTitle` and the H1 heading to the same Chinese title from Step 1. Preserve the existing descriptions, child lists, and article lists except for URL replacements in Step 3.

- [x] **Step 3: Apply the complete URL-prefix replacement map**

Across `content/docs/languages/java`, the three path-sensitive test files, and `docs/superpowers/specs/2026-07-16-unified-keyword-search-design.md`, replace prefixes using this exact map:

```text
/docs/languages/java/jvm/                    → /docs/languages/java/core-foundations/jvm/
/docs/languages/java/java8-tutorial/         → /docs/languages/java/core-foundations/java-8/
/docs/languages/java/java-concurrent/        → /docs/languages/java/core-foundations/concurrent-programming/
/docs/languages/java/annotation/             → /docs/languages/java/core-foundations/annotations/
/docs/languages/java/regex/                  → /docs/languages/java/core-foundations/regular-expressions/
/docs/languages/java/freemarker/             → /docs/languages/java/template-engines/freemarker/
/docs/languages/java/thymeleaf/              → /docs/languages/java/template-engines/thymeleaf/
/docs/languages/java/velocity/               → /docs/languages/java/template-engines/velocity/
/docs/languages/java/jpa/                    → /docs/languages/java/persistence-frameworks/jpa/
/docs/languages/java/hibernate/              → /docs/languages/java/persistence-frameworks/hibernate/
/docs/languages/java/mybatis/                → /docs/languages/java/persistence-frameworks/mybatis/
/docs/languages/java/struts2/                → /docs/languages/java/web-frameworks/struts2/
/docs/languages/java/spring/                 → /docs/languages/java/web-frameworks/spring/
/docs/languages/java/spring-boot/            → /docs/languages/java/web-frameworks/spring-boot/
/docs/languages/java/spring-cloud/           → /docs/languages/java/web-frameworks/spring-cloud/
/docs/languages/java/spring-web-flux/        → /docs/languages/java/web-frameworks/spring-webflux/
/docs/languages/java/tomcat/                 → /docs/languages/java/web-containers/tomcat/
/docs/languages/java/resin/                  → /docs/languages/java/web-containers/resin/
/docs/languages/java/log/                    → /docs/languages/java/engineering-ecosystem/logging/
/docs/languages/java/schedule/               → /docs/languages/java/engineering-ecosystem/scheduling/
/docs/languages/java/security-framework/     → /docs/languages/java/engineering-ecosystem/security-frameworks/
/docs/languages/java/crawler/                → /docs/languages/java/engineering-ecosystem/crawler-frameworks/
/docs/languages/java/intro                   → /docs/languages/java/learning-resources
/docs/languages/java/ttf                     → /docs/languages/java/engineering-ecosystem/font-processing/ttf-fonts
```

Apply longer prefixes such as `spring-boot` and `spring-cloud` before the shorter `spring` prefix.

- [x] **Step 4: Update three test fixture file paths**

Make these exact string changes:

```text
tests/ve-starter-mdx.test.mjs
../content/docs/languages/java/velocity/ve-starter.mdx
→ ../content/docs/languages/java/template-engines/velocity/ve-starter.mdx

tests/spring-boot-version-intro-mdx.test.mjs
../content/docs/languages/java/spring-boot/spring-boot-version-intro.mdx
→ ../content/docs/languages/java/web-frameworks/spring-boot/spring-boot-version-intro.mdx

tests/foreign-phone-mdx.test.mjs
../content/docs/languages/java/regex/foreign-phone.mdx
→ ../content/docs/languages/java/core-foundations/regular-expressions/foreign-phone.mdx
```

- [x] **Step 5: Verify Spring navigation explicitly**

Run:

```powershell
Get-Content -Raw -Encoding UTF8 'content\docs\languages\java\web-frameworks\spring\meta.json'
rg -n '/docs/languages/java/' 'content\docs\languages\java\web-frameworks\spring\index.mdx'
```

Expected: `meta.json` retains `index` plus its 17 existing article slugs in the same order; every link returned from `index.mdx` begins with `/docs/languages/java/web-frameworks/spring/`.

### Task 5: Run migration verification and review the final diff

**Files:**

- Verify: the complete moved Java tree, tests, and generated Fumadocs/TypeScript output.

**Interfaces:**

- Consumes: all migrated files from Tasks 1–4.
- Produces: evidence that navigation, content inventory, path-sensitive tests, MDX generation, and TypeScript types are valid.

- [x] **Step 1: Run all Node tests**

Run:

```powershell
node --test tests/*.test.mjs
```

Expected: every test passes, including all four cases in `java-doc-structure.test.mjs`.

- [x] **Step 2: Scan active content and tests for old Java URLs and paths**

Run:

```powershell
rg -n '/docs/languages/java/(annotation|crawler|freemarker|hibernate|java-concurrent|java8-tutorial|jpa|jvm|log|mybatis|regex|resin|schedule|security-framework|spring|spring-boot|spring-cloud|spring-web-flux|struts2|thymeleaf|tomcat|velocity)(/|\b)' content tests src
rg -n 'content/docs/languages/java/(velocity|spring-boot|regex)/' tests
```

Expected: both searches return no results. The historical path-mapping table in the approved design specification is intentionally excluded from this active-reference scan.

- [x] **Step 3: Generate MDX metadata and run TypeScript checks**

Run:

```powershell
npm.cmd run types:check
```

Expected: `fumadocs-mdx`, `next typegen`, and `tsc --noEmit` all exit successfully.

- [x] **Step 4: Check whitespace errors and inspect migration status**

Run:

```powershell
git diff --check
git status --short -- 'content/docs/languages/java' tests docs/superpowers/specs/2026-07-16-unified-keyword-search-design.md
```

Expected: `git diff --check` is silent. Status shows the intended directory moves/additions and path updates, alongside preserved user-owned modifications. Do not stage or commit these files without explicit user authorization.

- [x] **Step 5: Report the verified result**

Report the new root domains, the new Spring path, test/type-check outcomes, and any unrelated pre-existing changes left untouched. Include direct links to `content/docs/languages/java/meta.json`, `content/docs/languages/java/index.mdx`, and `content/docs/languages/java/web-frameworks/spring/index.mdx`.
