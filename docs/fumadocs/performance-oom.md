# Fumadocs 大文档站 OOM 优化记录

这份记录用于整理一次 `pnpm dev` 编译 `/docs/[...slug]` 时出现的内存溢出问题，以及当前项目采用的优化方式。

错误现象通常类似下面这样：

```txt
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

日志里如果出现正在编译文档路由，例如：

```txt
Compiling /docs/[...slug] ...
```

说明问题大概率不只是某个接口访问时才触发，而是文档内容在 Next.js/Fumadocs 编译阶段已经被一次性加载得太多。

---

## 1. 高风险写法

大文档站要特别避免一次性取出所有文章正文，例如：

```ts
const posts = await getAllPosts();
```

在 Fumadocs 项目中，同类风险通常表现为：

```ts
const pages = source.getPages();
const texts = await Promise.all(pages.map((page) => page.data.getText('processed')));
```

这类写法的问题在于：

- `source.getPages()` 会拿到全站页面列表；
- `getText('processed')` 会读取处理后的 Markdown；
- `Promise.all()` 会让所有正文同时进入内存；
- 文档数量和单篇内容变大后，开发服务器很容易冲到 Node.js heap 上限。

如果只是用 `source.getPages()` 生成 slug、标题、描述、导航卡片，风险相对较低；真正危险的是在全量列表上继续读取正文、MDX body、processed markdown 或生成搜索索引。

---

## 2. processed markdown 的内存放大

当前问题的关键放大器是 collection 配置中的：

```ts
postprocess: {
  includeProcessedMarkdown: true,
}
```

这个选项会让每篇 MDX 额外导出 `_markdown`，也就是除了正常渲染需要的 MDX 模块，还会把处理后的 Markdown 文本塞进编译产物。

在小站点里它很方便，可以直接用：

```ts
await page.data.getText('processed');
```

但在文章很多的文档站里，它会明显增加内存占用。尤其当 `/docs/[...slug]` 编译时需要加载大量 MDX 模块，就会更容易触发 OOM。

---

## 3. 当前采用的优化方案

### 3.1 开启 Fumadocs async collection

在 `source.config.ts` 中给 docs 和 blog 开启 `async: true`：

```ts
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    async: true,
    schema: pageSchema.extend({
      // ...
    }),
  },
});

export const blog = defineCollections({
  type: 'doc',
  dir: 'content/blog',
  async: true,
  schema: pageSchema.extend({
    // ...
  }),
});
```

开启后，Fumadocs 生成的 `.source/server.ts` 会优先静态导入 frontmatter：

```ts
import { frontmatter } from '../content/docs/example.mdx?collection=docs&only=frontmatter';
```

正文部分则变成动态加载：

```ts
() => import('../content/docs/example.mdx?collection=docs')
```

这样 `/docs/[...slug]` 编译时不会急着把所有文档正文都吃进内存。

### 3.2 页面渲染时只加载当前文档正文

开启 `async: true` 后，页面里不能再直接读取：

```ts
const MDX = page.data.body;
```

需要改成按当前页面加载：

```ts
const { body: MDX, toc } = await page.data.load();
```

然后继续正常渲染：

```tsx
<DocsPage toc={toc} full={page.data.full}>
  <MDX components={getMDXComponents()} />
</DocsPage>
```

博客详情页同理：

```ts
const { body: MDX } = await post.load();
```

### 3.3 移除 includeProcessedMarkdown

如果没有强依赖 processed markdown，应移除：

```ts
postprocess: {
  includeProcessedMarkdown: true,
}
```

如果只是给 LLM 文本、复制 Markdown、下载 Markdown 等功能使用，可以优先读取原始 Markdown：

```ts
const markdown = await page.data.getText('raw');
```

这不会要求每篇文档在编译产物里额外保留 `_markdown`。

---

## 4. llms-full.txt 的注意点

全量导出 LLM 文本时，不建议这样写：

```ts
const scan = source.getPages().map(getLLMText);
const scanned = await Promise.all(scan);
```

更稳妥的方式是顺序读取：

```ts
const scanned: string[] = [];

for (const page of source.getPages()) {
  scanned.push(await getLLMText(page));
}
```

这样虽然会慢一点，但不会把所有正文读取任务同时堆进内存。

---

## 5. /api/chat 搜索索引的后续风险

如果聊天接口或搜索接口需要构建全站索引，要特别小心下面这种模式：

```ts
source.getPages().map(async (page) => ({
  content: await page.data.getText('processed'),
}));
```

在关闭 `includeProcessedMarkdown` 后，`getText('processed')` 会直接报错。

后续可以按实际需求选择：

- 改成 `getText('raw')`；
- 构建离线索引，不在 dev server 启动或首个请求时全量构建；
- 分批读取，并避免一次性 `Promise.all()` 全站正文；
- 限制索引字段，只索引标题、描述、路径、少量摘要。

---

## 6. 验证方式

修改后建议运行：

```bash
pnpm types:check
```

重点确认：

- Fumadocs 可以重新生成 `.source`；
- `next typegen` 可以完成；
- `tsc --noEmit` 没有类型错误；
- `.source/server.ts` 中 docs 正文已经变成动态 import；
- `/docs/[...slug]` 页面使用 `await page.data.load()` 加载当前文章。

如果 `.source/server.ts` 仍然对大量 `.mdx?collection=docs` 做完整静态导入，说明 async collection 没有生效，需要重新检查 `source.config.ts`。

---

## 7. metadataBase 警告说明

下面这个提示不是 OOM 主因：

```txt
metadataBase property in metadata export is not set
```

它表示 Next.js 在生成 Open Graph 或 Twitter 图片地址时没有配置站点基础 URL，于是回退到 `http://localhost:3000`。

它可以单独通过根布局的 metadata 配置修复，但不影响本次内存优化判断。
