# Fumadocs 安装与接入

Fumadocs 支持两种接入方式：

- **新项目**：使用官方脚手架一键初始化
- **已有项目**：手动集成到现有 Next.js 项目中

---

## 1. 一键初始化（新项目）

使用官方脚手架快速创建文档站：

```bash
pnpm create fumadocs-app
```

执行后按提示选择框架与配置。完成后进入目录并启动开发服务：

```bash
cd my-docs
pnpm dev
```

默认通过 `http://localhost:3000/docs` 访问文档页。

---

## 2. 手动集成（已有项目）

适用于已有 Next.js 项目，要求 `Node.js 22+`。

### 2.1 安装依赖

```bash
pnpm add fumadocs-ui fumadocs-core fumadocs-mdx
```

### 2.2 配置 `source.config.ts`

```ts
import { defineDocs, defineConfig } from 'fumadocs-mdx/config';

export const docs = defineDocs({
  dir: 'content/docs',
});

export default defineConfig();
```

告诉 Fumadocs 文档内容的位置及内容源的生成方式。

### 2.3 配置 `next.config.ts`

```ts
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

export default withMDX({
  /* next config */
});
```

将 MDX 处理能力接入 Next.js 构建流程。

### 2.4 创建内容加载入口

```ts
// lib/source.ts
import { loader } from 'fumadocs-core/source';
import { docs } from '@/.source';

export const source = loader({
  source: docs.toFumadocsSource(),
  baseUrl: '/docs',
});
```

后续页面获取文档树、根据 slug 查询页面都依赖此 `source` 对象。

---

## 3. 路由结构

文档页至少需要一个布局文件和一个页面文件：

```text
app/
└── docs/
    ├── layout.tsx
    └── [[...slug]]/
        └── page.tsx
```

### 3.1 `layout.tsx`

```tsx
import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';

export default function Layout({ children }) {
  return (
    <DocsLayout tree={source.pageTree}>
      {children}
    </DocsLayout>
  );
}
```

负责渲染侧边栏、文档树和整体阅读布局。

### 3.2 `[[...slug]]/page.tsx`

```tsx
import { source } from '@/lib/source';
import { DocsPage, DocsBody, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';

export default async function Page({ params }) {
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsBody>
        <MDX />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}
```

根据路由参数读取对应文档并完成内容渲染。

---

## 4. 第一篇文档

在 `content/docs/` 下新建 MDX 文件：

```mdx
---
title: 开始使用
description: 第一篇文档
---

## 欢迎

这是我的文档站。
```

如需管理文档顺序或目录结构，通过 `meta.json` 做额外配置。

---

## 5. 目录结构参考

```text
my-docs/
├── content/
│   └── docs/
│       ├── meta.json
│       └── index.mdx
├── app/
│   └── docs/
│       ├── layout.tsx
│       └── [[...slug]]/
│           └── page.tsx
├── lib/
│   └── source.ts
└── source.config.ts
```

---

## 6. 项目结构说明

| 路径 | 说明 |
| --- | --- |
| `lib/source.ts` | 内容源适配器，[`loader()`](https://fumadocs.dev/docs/headless/source-api) 提供访问内容的接口 |
| `lib/layout.shared.tsx` | 布局共享配置，可选但建议保留 |
| `app/(home)` | 落地页和其他页面的路由组 |
| `app/docs` | 文档布局和页面 |
| `app/api/search/route.ts` | 搜索路由处理器 |

`source.config.ts` 支持自定义选项（如 frontmatter schema），详见 [Fumadocs MDX 文档](https://fumadocs.dev/docs/mdx)。

---

## 参考资料

- [Fumadocs 官方文档](https://fumadocs.dev)
- [Next.js 文档](https://nextjs.org/docs)
- [Next.js 入门教程](https://nextjs.org/learn)