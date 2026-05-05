# Fumadocs 与 Shadcn UI 集成

Fumadocs 和 Shadcn UI 的组合非常自然。两者都建立在 Tailwind CSS 和 CSS 变量体系之上，适合同时承担“文档框架”和“业务组件库”的角色。对于当前项目，这也是更稳妥的一种前端搭配方式。

---

## 1. 为什么推荐 Shadcn UI

Fumadocs UI 的整体设计思路与 Shadcn UI 接近，主题机制也更容易统一。直接引入官方提供的 `shadcn.css` 预设后，文档站点会继承 Shadcn 的变量体系，减少两套视觉风格冲突的问题。

```css
/* global.css */
@import 'tailwindcss';
@import 'fumadocs-ui/css/shadcn.css';
@import 'fumadocs-ui/css/preset.css';
```

这意味着文档页和你项目中的业务组件可以共享一套颜色、圆角和排版风格。

---

## 2. 基础接入流程

先初始化 Shadcn UI：

```bash
pnpm dlx shadcn@latest init
```

然后按需添加组件，例如按钮、徽标、弹窗、表格等。文档站点中常用的通常是：

- `button`
- `badge`
- `tabs`
- `table`
- `dialog`
- `card`

这些组件在做示例面板、提示卡片和交互说明时会比较方便。

---

## 3. 在 MDX 中使用组件

Shadcn 组件可以直接在 MDX 中导入并渲染：

```mdx
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

## 示例

<Button>点击我</Button>
<Badge>NEW</Badge>
```

这种方式适合做文档里的交互示例、状态展示或操作按钮说明。相比纯 Markdown，它在表达复杂 UI 结构时更直接。

---

## 4. 适合当前项目的原因

对于 `dz-notes` 这类内容站点，Fumadocs 更适合负责文档结构、页面骨架和阅读体验，Shadcn UI 更适合承载卡片、标签、按钮、弹层等业务化组件。

整体技术关系可以理解为：

```text
Fumadocs UI     -> 文档框架与页面结构
Shadcn UI       -> 通用交互组件
Tailwind CSS    -> 样式基础
Next.js         -> 应用运行框架
```

这样做的好处是分工清晰，后续你在首页、专题页、频道卡片等区域做自定义扩展时，也不需要脱离 Fumadocs 原有体系。

---

## 5. 使用建议

- 文档主体继续交给 Fumadocs。
- 交互性较强的区块优先用 Shadcn UI 组件构建。
- 样式层尽量统一在 CSS 变量和 Tailwind 语义类中，不要为文档区和业务区维护两套视觉系统。

如果后续首页或频道页需要更多组件化展示，这套组合会比单独扩展 Fumadocs 自带组件更灵活。
