# Fumadocs Header 定制

Fumadocs 的 Header 定制大致可以分为三层：配置式扩展、局部插槽注入、完全替换导航组件。当前项目更适合优先使用前两种方式，既能满足定制需求，也能降低后续升级成本。

---

## 1. 配置式定制

官方更推荐把通用配置抽到一个共享文件中，再由不同布局复用。这样首页、文档页、博客页可以共享 Logo、GitHub 链接和基础导航配置。

```ts
// lib/layout.shared.ts
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { GithubIcon } from 'lucide-react';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'dz-notes',
      transparentMode: 'top',
    },
    githubUrl: 'https://github.com/yourname',
    links: [
      {
        text: '文档',
        url: '/docs',
        active: 'nested-url',
      },
      {
        text: '博客',
        url: '/blog',
        active: 'nested-url',
      },
      {
        type: 'icon',
        label: 'GitHub',
        icon: <GithubIcon />,
        url: 'https://github.com/yourname',
        secondary: true,
      },
    ],
  };
}
```

这种方式适合大多数场景，优点是结构稳定，多个页面之间也更容易保持一致。

---

## 2. 下拉菜单导航

如果首页需要更强的引导能力，可以在 `HomeLayout` 中加入自定义下拉菜单。这样既保留了官方导航结构，也能增加频道入口。

```tsx
// app/(home)/layout.tsx
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import {
  NavbarMenu,
  NavbarMenuContent,
  NavbarMenuLink,
  NavbarMenuTrigger,
} from 'fumadocs-ui/layouts/home/navbar';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }) {
  return (
    <HomeLayout
      {...baseOptions()}
      links={[
        {
          type: 'custom',
          on: 'nav',
          children: (
            <NavbarMenu>
              <NavbarMenuTrigger>文档</NavbarMenuTrigger>
              <NavbarMenuContent>
                <NavbarMenuLink href="/docs/notion">Notion</NavbarMenuLink>
                <NavbarMenuLink href="/docs/web">Web 开发</NavbarMenuLink>
                <NavbarMenuLink href="/docs/coding">编程学习</NavbarMenuLink>
              </NavbarMenuContent>
            </NavbarMenu>
          ),
        },
      ]}
    >
      {children}
    </HomeLayout>
  );
}
```

这种方式适合首页导航，不建议在所有页面都堆叠复杂菜单，否则会影响文档页的阅读效率。

---

## 3. 完全替换 Header

如果现有导航结构已经无法满足需求，可以直接替换 `nav.component`，完全接管 Header 的渲染。

```tsx
// lib/layout.shared.ts
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { CustomNavbar } from '@/components/custom-navbar';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      component: <CustomNavbar />,
    },
  };
}
```

替换后需要同步维护导航高度，否则文档布局容易出现偏移。

```css
/* global.css */
:root {
  --fd-nav-height: 56px;
}
```

如果是完全关闭内置导航，再用全局 Header 接管，也可以通过 `enabled: false` 来实现：

```tsx
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      enabled: false,
      title: 'dz-notes',
    },
  };
}
```

此时建议把 `--fd-nav-height` 设为 `0`，或者设为自定义 Header 的实际高度。

```css
:root {
  --fd-nav-height: 0px;
}
```

---

## 4. 补充扩展方式

除了整块替换，也可以只做轻量扩展。

### 4.1 使用 `nav.children`

这种方式只是在官方导航内部追加内容，侵入性最小。

```tsx
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'dz-notes',
      children: (
        <span className="ml-2 text-xs text-muted-foreground">beta</span>
      ),
    },
  };
}
```

### 4.2 包装官方组件

如果只是想在官方 Navbar 外再增加一层公告、状态条或额外信息，可以包一层组件，而不是直接复制整套源码。

```tsx
// components/custom-navbar.tsx
import { Navbar } from 'fumadocs-ui/layouts/home/navbar';
import { baseOptions } from '@/lib/layout.shared';

export function CustomNavbar() {
  return (
    <div>
      <Navbar {...baseOptions()} />
      <div className="bg-green-50 py-1 text-center text-xs">
        dz-notes v2.0 已上线
      </div>
    </div>
  );
}
```

---

## 5. 方式对比

| 方式 | 改动范围 | 维护成本 | 适用场景 |
| --- | --- | --- | --- |
| 配置式定制 | 小 | 低 | 常规导航调整 |
| `nav.children` 插槽 | 很小 | 很低 | 增加徽标、状态、提示 |
| 包装官方组件 | 中 | 中 | 加公告条、附加功能 |
| 完全替换 Header | 大 | 高 | 深度品牌化、自定义交互 |
| CLI 下载源码后改造 | 很大 | 很高 | 需要完全控制官方组件 |

---

## 6. 对当前项目的建议

`dz-notes` 当前更适合下面的组合方式：

- 首页使用下拉菜单，引导进入不同频道。
- 文档页继续保持配置式导航，保证阅读区域简洁。
- 只在确实需要时，使用 `nav.children` 或包装组件增加少量扩展。
- 不到必要时不要直接复制官方导航源码，否则后续升级需要手动比对差异。

如果只是做频道入口和少量视觉增强，优先保留官方结构，比完全自定义更稳妥。
