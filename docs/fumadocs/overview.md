# Fumadocs 常用配置总览

这份文档用于整理当前项目里最常见的 Fumadocs 配置点，包括导航显示位置、频道切换、主题色覆盖以及按频道动态换色。适合在做结构扩展时先快速查阅一遍。

---

## 1. 官方组件文档

Fumadocs UI 的组件说明优先参考官方文档：

- https://www.fumadocs.dev/docs/ui/components

如果只是查某个组件的属性和使用方式，直接看官方说明会更准确；项目内文档更适合记录落地方案和约定。

---

## 2. 顶部导航链接显示位置

`baseOptions()` 中的 `links` 会被多个布局复用。默认情况下，这些链接可能同时出现在顶部导航和移动端菜单中。

如果只希望它出现在顶部导航，可以通过 `on: 'nav'` 限制显示位置。

```ts
links: [
  {
    type: 'button',
    text: '首页',
    url: '/',
    active: 'nested-url',
    on: 'nav',
  },
  {
    type: 'button',
    text: '文档',
    url: '/docs',
    active: 'nested-url',
    on: 'nav',
  },
]
```

可选值如下：

| 值 | 作用 |
| --- | --- |
| `'nav'` | 只显示在顶部导航 |
| `'menu'` | 只显示在移动端菜单 |
| 不设置 | 顶部与菜单都可能显示 |

对于首页、文档、博客这类全局主入口，通常更适合设置为 `on: 'nav'`。

---

## 3. 按频道切换文档树

如果希望进入某个频道后，左侧只显示当前频道的内容，可以使用 Fumadocs 的根节点切换能力。

### 3.1 方案一：频道目录声明为根节点

在每个频道的 `meta.json` 中加上 `"root": true`：

```json
{
  "title": "Web 开发",
  "root": true,
  "icon": "Globe"
}
```

这样 `DocsLayout` 使用完整文档树时，Fumadocs 会自动在侧边栏顶部生成频道切换入口。

```tsx
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/source';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }) {
  return (
    <DocsLayout {...baseOptions()} tree={source.getPageTree()}>
      {children}
    </DocsLayout>
  );
}
```

这是更推荐的方案，配置集中在内容目录本身，新增频道时也更容易维护。

### 3.2 方案二：手动配置 `tabs`

如果需要完全手写频道切换项，也可以直接传 `tabs`。

```tsx
<DocsLayout
  {...baseOptions()}
  tree={source.getPageTree()}
  tabs={[
    {
      title: 'Notion',
      description: '使用技巧与模板整理',
      url: '/docs/notion',
    },
    {
      title: 'Web 开发',
      description: '前端工程与框架实践',
      url: '/docs/web',
    },
  ]}
>
  {children}
</DocsLayout>
```

这种方式适合需要完全自定义说明文案的场景，但要手动维护配置。

---

## 4. 主题色基础配置

Fumadocs 自带多套主题色，可以先引入官方主题，再在项目里做覆盖。

```css
/* app/global.css */
@import 'tailwindcss';
@import 'fumadocs-ui/css/neutral.css';
@import 'fumadocs-ui/css/preset.css';

@source '../node_modules/fumadocs-ui/dist/**/*.js';
```

如果只是想换掉默认配色，可以替换上面的主题文件，例如 `black`、`dusk`、`ocean`、`emerald` 等。

---

## 5. 覆盖官方主题变量

在 `global.css` 中直接覆盖 `--color-fd-*` 变量，就可以在不改组件代码的前提下修改站点主色。

```css
:root {
  --color-fd-primary: hsl(158, 69%, 37%);
  --color-fd-primary-foreground: hsl(0, 0%, 98%);
  --color-fd-background: hsl(0, 0%, 100%);
  --color-fd-card: hsl(0, 0%, 97%);
}

.dark {
  --color-fd-primary: hsl(158, 69%, 45%);
  --color-fd-background: hsl(0, 0%, 7%);
  --color-fd-card: hsl(0, 0%, 10%);
}
```

这种方式适合统一品牌色，或者整体调整明暗主题。

> 当前项目覆盖主题色实战案例：[swarm](src/app/styles/theme/warm.css)

---

## 6. 扩展频道级颜色变量

如果站点中不同频道需要独立色彩体系，可以在官方变量之外再定义一组项目变量。

```css
:root {
  --dz-color-notion: #b4b2a9;
  --dz-color-notion-light: rgba(180, 178, 169, 0.12);

  --dz-color-web: #1d9e75;
  --dz-color-web-light: rgba(29, 158, 117, 0.12);

  --dz-color-coding: #378add;
  --dz-color-coding-light: rgba(55, 138, 221, 0.12);
}

.dark {
  --dz-color-notion-light: rgba(180, 178, 169, 0.08);
  --dz-color-web-light: rgba(29, 158, 117, 0.08);
  --dz-color-coding-light: rgba(55, 138, 221, 0.08);
}
```

组件中可以直接引用这些变量：

```tsx
<span className="text-[var(--dz-color-notion)]">Notion</span>
```

这类变量更适合频道卡片、专题入口、分类标识等局部视觉元素。

---

## 7. 运行时按频道动态切换主色

如果你希望访问不同频道时动态改变站点主色，可以在客户端通过 `document.documentElement.style.setProperty()` 覆盖主题变量。

```tsx
'use client';

import { useEffect } from 'react';

const channelColors: Record<string, string> = {
  notion: '#B4B2A9',
  web: '#1D9E75',
  coding: '#378ADD',
};

export function useChannelTheme(channel: string) {
  useEffect(() => {
    const color = channelColors[channel];
    if (!color) return;

    document.documentElement.style.setProperty('--color-fd-primary', color);

    return () => {
      document.documentElement.style.removeProperty('--color-fd-primary');
    };
  }, [channel]);
}
```

在频道布局中调用即可：

```tsx
'use client';

import { useChannelTheme } from '@/hooks/useChannelTheme';

export default function ChannelLayout({ params, children }) {
  useChannelTheme(params.channel);
  return <>{children}</>;
}
```

这种做法适合首页和文档页联动较强的项目，但要注意不要让主题变化过于频繁，避免影响阅读稳定性。

---

## 8. 当前项目建议

- 导航入口统一放在共享配置中维护。
- 频道切换优先使用 `meta.json` 的 `root: true`。
- 主题色优先通过 CSS 变量覆盖，不要先上运行时逻辑。
- 只有在频道个性化确实很强时，再增加动态换色。

先把内容结构和主题变量层次理顺，后面的首页、专题广场、频道页会更容易统一。
