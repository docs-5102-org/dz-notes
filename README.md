# dz-notes

基于 [Fumadocs](https://github.com/fuma-nama/fumadocs) 和 Next.js 构建的知识文档站，主要用于沉淀多频道技术笔记、专题内容与文档组件实践。

## 本地开发

```bash
pnpm dev
```

启动后访问 `http://localhost:3000`。

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
- `.claude/agents`：内容迁移、MDX 规范、文档改造规则。

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

- [MDX Agent 规则](.claude/agents/mdx-agent.md)
- [Fumadocs 内容源配置](source.config.ts)
- [站点配置](src/lib/site.ts)

---

## 开发建议

- 新增频道时，优先补齐 `index.mdx`、`meta.json` 和必要的描述信息。
- 文档迁移到 MDX 时，优先遵循 `.claude/agents/mdx-agent.md` 中的规则。
- 代码块语言标记、图片标签、自定义链接语法等内容，尽量统一后再批量处理。

---

## 备注

如果后续频道继续扩展，建议同步维护本 README 的“内容频道”和“项目结构”部分，避免入口信息滞后。

codex resume 019dfdc8-d3c4-7c50-90b1-2a476437e79b

// "dev": "cross-env NODE_OPTIONS=--max-old-space-size=4096 next dev",


频道分类 编程语言应该显示的是正确的，Java 不应该作为单独的频道分类

已完成 
ai、bigdata、blockchain、storage、game-development、mobile_native、cross_platform
