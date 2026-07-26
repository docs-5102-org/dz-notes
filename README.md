# dz-notes

基于 [Fumadocs](https://github.com/fuma-nama/fumadocs) 和 Next.js 构建的知识文档站，主要用于沉淀多频道技术笔记、专题内容与文档组件实践。

## 本地开发

```bash
pnpm dev
```

启动后访问 `http://localhost:3000`。

---

## 构建与部署注意事项

Vercel 等部署环境运行在 Linux 中，MDX 内引用 `public/` 静态资源时必须使用站点根路径和正斜杠。例如：

```mdx
![](/assets/images/blog/example.png)
```

不要写成相对文件路径（如 `../../public/assets/images/...`），也不要使用 Windows 反斜杠（如 `/assets/images\\blog\\example.png`）。MDX 会将这类写法编译为模块导入，而 Linux 构建无法解析包含反斜杠的路径，最终会报 `Module not found`。

---

## 项目结构

下面是当前仓库的主要目录分层，便于快速定位内容、页面和脚本入口：

```text
dz-notes/
├── .claude/                 # Agent / 文档规范配置
├── content/                 # 站点内容源
│   └── docs/                # 各技术频道文档
├── docs/                    # 项目说明文档与内部使用文档
│   ├── fumadocs/            # Fumadocs 使用与接入说明
│   └── images/              # 文档配图资源
├── grammars/                # 代码高亮语言注册资源
├── public/                  # 静态资源
├── scripts/                 # 构建、转换、辅助脚本
├── src/
│   ├── app/                 # Next.js App Router 页面入口
│   ├── components/          # 通用组件、文档组件
│   └── lib/                 # 数据源、站点配置、工具方法
├── source.config.ts         # Fumadocs 内容源配置
├── next.config.mjs          # Next.js 配置
└── README.md
```

### 关键目录说明

- `content/docs`：站点实际渲染的技术文档内容，频道、分类、文章都在这里维护。
- `docs/fumadocs`：项目内部的 Fumadocs 使用说明、组件说明、接入约定。
- `src/app`：页面路由与布局入口。
- `src/components/docs`：文档首页、专题广场、文章卡片等文档相关 UI 组件。
- `src/lib`：站点频道、内容源、导航配置等核心逻辑。
- `.agents`：共享 Agent 的唯一源文件；`.claude` 与 `.codex` 配置由同步脚本生成。

### 关键配置文件说明

#### `source.config.ts`

这个文件是当前项目的 Fumadocs 内容源核心配置，主要负责三件事：

1. 定义 `content/docs` 的文档集合与 frontmatter 扩展字段。
2. 定义 `content/blog` 的博客集合结构。
3. 配置 MDX 代码块高亮、语言别名和自定义语法注册。

当前项目中的核心结构如下：

```ts
import { defineCollections, defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';
import path from 'path/win32';
import fs from 'node:fs';
```

上面这部分主要用于：

- `defineDocs`：注册 `content/docs` 文档目录。
- `defineCollections`：注册博客集合。
- `pageSchema`、`metaSchema`：扩展页面 frontmatter 和 `meta.json` 结构。
- `zod`：对 frontmatter 字段做类型约束和转换。
- `fs`、`path`：读取本地自定义语法文件。

文档集合部分：

```ts
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema.extend({
      subTitle: z.string().optional(),
      category: z.array(z.string()).optional(),
      tag: z.array(z.string()).optional(),
      tags: z
        .array(z.string())
        .optional()
        .default([])
        .transform(tags => tags.filter(tag => tag.trim() !== '')),
      date: z.coerce.string().optional(),
      source: z.string().optional(),
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});
```

这部分的作用：

- `dir: 'content/docs'`：声明站点文档的根目录。
- `subTitle`：给 `index.mdx` 或列表页卡片补充副标题。
- `category`：支持页面声明所属分类。
- `tag`：兼容旧字段。
- `tags`：新的标签字段，默认返回数组，并过滤空字符串。
- `date: z.coerce.string()`：允许 `date` 被自动转成字符串，减少 frontmatter 因日期类型导致的报错。
- `source`：用于记录文章来源或引用地址。
- `includeProcessedMarkdown: true`：保留处理后的 Markdown 内容，方便后续渲染和扩展。

博客集合部分：

```ts
export const blog = defineCollections({
  type: 'doc',
  dir: 'content/blog',
  schema: pageSchema.extend({
    date: z.coerce.string(),
    category: z.string(),
    excerpt: z.string().optional(),
  }),
  postprocess: {
    includeProcessedMarkdown: true,
  },
});
```

这部分单独定义博客内容源，和 `content/docs` 分开维护。博客必填 `date` 和 `category`，同时支持可选摘要 `excerpt`。

代码高亮与语言注册部分：

```ts
const plantumlGrammar = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), 'grammars/plantuml.tmLanguage.json'),
    'utf-8'
  )
);
```

这段代码会从本地 `grammars/` 目录读取 PlantUML 语法定义，用于后续注册到代码高亮系统。

```ts
export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      langs: ['bash', 'properties', 'cmd', 'groovy', 'ini',
        {
          ...plantumlGrammar,
          name: 'plantuml',
          aliases: ['puml', 'pu', 'wsd'],
        },
      ],
      langAlias: {
        cmd: 'bat',
        dotenv: 'ini',
        env: 'ini',
        gradle: 'groovy',
        gitignore: 'ini',
        ignore: 'ini',
        properties: 'ini',
        shell: 'bash',
        redis: 'bash',
      },
    },
  },
});
```

这部分的作用：

- `themes`：设置代码高亮在浅色和深色模式下分别使用的主题。
- `langs`：显式加载项目中常用的代码块语言。
- 自定义 `plantuml`：让文档中的 `plantuml`、`puml`、`pu`、`wsd` 代码块可以被正确高亮。
- `langAlias`：统一旧文档和不同作者的语言标记写法，避免 `ignore`、`gradle`、`shell`、`properties` 之类标签无法识别。

对当前项目来说，`source.config.ts` 不只是内容源入口，也是 MDX 迁移兼容层和代码块语言规范入口。

#### `next.config.mjs`

这个文件主要负责把 Fumadocs MDX 接入 Next.js，同时补充图片加载配置。

当前项目实现如下：

```js
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();
```

这部分用于创建 MDX 包装器，让 Next.js 能识别和处理项目中的 `.mdx` 内容文件。

实际配置如下：

```js
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      new URL('https://picsum.photos/**'),
    ],
  },
};

export default withMDX(nextConfig);
```

各部分作用如下：

- `reactStrictMode: true`：在开发环境下启用 React 严格模式，帮助发现副作用和潜在问题。
- `images.remotePatterns`：允许 `next/image` 加载指定外部域名的图片。
- `https://picsum.photos/**`：当前项目已经放行这个测试图床，避免 MDX 或组件中引用该域名图片时报 `hostname is not configured`。
- `withMDX(nextConfig)`：把普通 Next.js 配置和 Fumadocs MDX 能力合并导出。

如果后续文档中继续引入外部图片，比如 Unsplash、CDN 或其他图床，需要继续在 `remotePatterns` 里追加对应域名。

## 脚本使用说明

项目辅助脚本统一放在 `scripts/` 目录。执行会修改文件的脚本前，建议先确认 Git 工作区状态，以便检查和恢复变更。

### `sync-agents.mjs`

以 `.agents/mdx-agent.md` 为唯一源，生成 Claude 和 Codex 使用的 Agent 配置。不要直接修改生成文件：

- `.claude/agents/mdx-agent.md`
- `.codex/agents/mdx-agent.toml`

修改唯一源后执行：

```bash
pnpm agents:sync
```

提交前检查生成文件是否与唯一源一致：

```bash
pnpm agents:check
```

`agents:check` 只检查、不写文件；目标文件缺失或内容不一致时会以非零状态退出。也可以直接执行 `node scripts/sync-agents.mjs`，并通过 `--check` 参数启用检查模式。

### `convert-grammar.mjs`

将 TextMate YAML grammar 转换成 Shiki 可加载的 JSON grammar。脚本依赖项目已有的 `js-yaml`，使用前需要先安装项目依赖。

```bash
node scripts/convert-grammar.mjs <本地文件或远程 URL> [输出文件]
```

本地文件示例：

```bash
node scripts/convert-grammar.mjs plantuml.tmLanguage grammars/plantuml.tmLanguage.json
```

远程文件示例：

```bash
node scripts/convert-grammar.mjs https://raw.githubusercontent.com/qjebbs/vscode-plantuml/master/syntaxes/plantuml.yaml-tmLanguage grammars/plantuml.tmLanguage.json
```

未指定输出文件时，脚本会在当前工作目录生成同名的 `.json` 文件。远程输入应使用可直接返回原始内容的 URL，例如 GitHub Raw 地址。

### `normalize-devops-ci-cd-tags.js`

扫描 `content/docs/devops/ci-cd` 中除 `index.mdx` 以外的 MDX 文件，根据 `src/lib/doc-tags.ts` 和脚本内置别名，把 `tag` 列表原地规范化为标签 slug。

```bash
node scripts/normalize-devops-ci-cd-tags.js
```

脚本不接收参数，会直接写回匹配的文档。遇到无法映射的中文标签时，会列出文件和标签并以非零状态退出；执行后应通过 Git diff 检查变更。

### `normalize-devops-linux-tags.js`

扫描 `content/docs/devops/linux` 中除 `index.mdx` 以外的 MDX 文件，根据 `src/lib/doc-tags.ts` 和脚本内置别名，把 `tag` 列表原地规范化为标签 slug。

```bash
node scripts/normalize-devops-linux-tags.js
```

该脚本同样不接收参数并会直接写回文档。遇到无法映射的中文标签时，会列出文件和标签并以非零状态退出；执行后应通过 Git diff 检查变更。

### `rename_md_to_mdx.sh`

递归扫描指定目录，把所有 `.md` 文件重命名为 `.mdx`。脚本需要 Bash，可在 Linux、macOS、WSL 或 Git Bash 中执行。

```bash
bash scripts/rename_md_to_mdx.sh [目标目录]
```

例如：

```bash
bash scripts/rename_md_to_mdx.sh ./content/docs/web/style_lang
```

未指定目标目录时默认处理当前目录。该脚本会直接移动文件，且不会自动修正文档之间指向 `.md` 的链接；执行前应仔细确认目标目录，执行后还需检查并修复相关链接。

---

## Docs 快捷导航

### 内容频道

- [AI](content/docs/ai)
- [Big Data](content/docs/bigdata)
- [Blockchain](content/docs/blockchain)
- [Cross Platform](content/docs/cross_platform)
- [DevOps](content/docs/devops)
- [Languages](content/docs/languages)
- [Middleware](content/docs/middleware)
- [Mobile Native](content/docs/mobile_native)
- [Storage](content/docs/storage)
- [Web](content/docs/web)

### 项目文档

- [Fumadocs 文档说明](docs/fumadocs)
- [Fumadocs Header 定制](docs/fumadocs/header.md)
- [Fumadocs 图片使用](docs/fumadocs/image.md)
- [Fumadocs 常用配置总览](docs/fumadocs/overview.md)
- [Fumadocs 与 Shadcn UI 集成](docs/fumadocs/setup-shadcn.md)
- [Fumadocs 安装与接入](docs/fumadocs/setup.md)
- [专题广场组件说明](notes-docs/showcase.md)

### 规则与配置

- [MDX Agent 规则](.agents/mdx-agent.md)
- [Fumadocs 内容源配置](source.config.ts)
- [站点配置](src/lib/site.ts)

修改共享 Agent 后，按照上方“脚本使用说明”运行 `pnpm agents:sync`；提交前使用 `pnpm agents:check` 检查生成文件是否一致。

---

## 开发建议

- 新增频道时，优先补齐 `index.mdx`、`meta.json` 和必要的描述信息。
- 文档迁移到 MDX 时，优先遵循 `.agents/mdx-agent.md` 中的规则。
- 代码块语言标记、图片标签、自定义链接语法等内容，尽量统一后再批量处理。

---
