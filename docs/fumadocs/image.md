# Fumadocs 图片使用

Fumadocs 在 MDX 中对图片做了较好的默认支持。常见场景主要分为三类：普通 Markdown 图片、带缩放能力的图片、直接使用 Next.js 的 `Image` 组件。实际选择时，先区分图片是文档专属资源，还是全站复用资源。

---

## 1. 基础用法

### 1.1 Markdown 图片

Fumadocs MDX 内置了图片处理能力，支持相对路径、`public` 目录以及外链图片。

```md
![描述](./my-image.png)
![描述](/images/my-image.png)
![描述](https://example.com/image.png)
```

对于本地图片，编译阶段会自动处理尺寸信息，通常不需要额外手动配置。

### 1.2 使用 Next.js `Image`

如果需要更细粒度的控制，例如占位、主题切换、类名样式或响应式行为，可以直接在 MDX 中导入 `Image` 组件。

```mdx
import Image from 'next/image';
import banner from './banner.png';

<Image src={banner} alt="Banner" placeholder="blur" />
```

这种方式更适合首页插图、封面图或需要精细排版的图片内容。

---

## 2. 给图片增加缩放能力

如果希望文档中的图片支持点击放大，可以在 MDX 组件映射中统一把 `img` 替换为 `ImageZoom`。

```tsx
// src/components/mdx.tsx
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import defaultComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultComponents,
    img: (props) => <ImageZoom {...(props as any)} />,
    ...components,
  } satisfies MDXComponents;
}
```

配置完成后，文档内原有的 Markdown 图片语法不需要改动：

```md
![这张图可以点击放大](/banner.png)
```

这种方式很适合教程型文档，尤其是截图较多的频道。

---

## 3. 图片存放建议

### 3.1 相对路径

文档专属图片建议直接放在 MDX 文件旁边，结构清晰，也方便一起维护。

```text
content/
└── docs/
    └── guide/
        ├── page.mdx
        └── hello.png
```

MDX 中直接使用相对路径：

```mdx
![示例图](./hello.png)
```

这种方式适合截图、流程图、局部说明图等只服务于当前文档的资源。

### 3.2 `public` 目录

如果图片需要在多篇文档中复用，或者本身就是全站公共资源，例如 Logo、分享图、封面图，可以放入 `public/`。

```text
public/
└── images/
    └── hello.png
```

引用方式如下：

```mdx
![示例图](/images/hello.png)
```

---

## 4. 两种存储方式对比

| 项目 | 相对路径 | `public` |
| --- | --- | --- |
| 存储位置 | 文档旁边 | 公共资源目录 |
| 引用方式 | `./image.png` | `/images/image.png` |
| 适合场景 | 文档专属图片 | 多页面复用图片 |
| 维护方式 | 内容与资源强绑定 | 集中管理 |

推荐原则很简单：文档私有资源跟文档放一起，全站共享资源放到 `public/`。

---

## 5. 常见错误

### 5.1 `next/image` 外链域名未配置

如果页面报错：

```txt
Invalid src prop on `next/image`, hostname is not configured under images in your `next.config.js`
```

原因是 Next.js 默认不允许随意加载外部图片域名，需要手动加入白名单。

可以在 `next.config.mjs` 中补充配置：

```js
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const nextConfig = {
  images: {
    remotePatterns: [
      new URL('https://picsum.photos/**'),
      // new URL('https://images.unsplash.com/**'),
      //  {
      //   protocol: 'https',
      //   hostname: 'picsum.photos',
      // },
      // 其他外部图片域名也在这里加
      // { hostname: 'images.unsplash.com' },
      // { hostname: 'cdn.yoursite.com' },
    ],
  },
};

export default withMDX(nextConfig);
```

修改配置后需要重启开发服务，热更新不会让这类配置自动生效。

---

## 6. 补充：静态部署下的 HTML 预览

如果某些文档需要通过 `iframe` 预览 HTML 文件，不建议在组件中依赖 `fs.readFileSync()` 去读取本地文件。那种方式要求运行时存在 Node.js 服务，不适合纯静态部署。

更稳妥的做法有两种：

1. 把预览文件放到 `public/`，再通过 URL 加载。
2. 在构建阶段把 HTML 内容内联到页面中。

如果目标是兼容静态托管，优先选择 `public/ + iframe src` 的方案，结构更稳定，也更容易迁移。

---

## 7. 使用建议

- 普通文档插图优先使用 Markdown 图片。
- 截图较多的频道建议启用 `ImageZoom`。
- 需要强控制时再使用 `<Image />`。
- 文档私有图片走相对路径，共享图片走 `public/`。
- 外链图片必须提前配置 Next.js 白名单。
