# 博客体验与 MDX 排版实施计划

> **For agentic workers:** Use superpowers:executing-plans task-by-task. 用户已授权自动实施，随后明确授权直接 commit/push 到 main，不新建分支或 PR。不另发部署命令或修改部署设置。复用所选云环境，原 work 分支已改名为 main。

**Goal:** 改善博客与文档站的联通、文章浏览和 Markdown 阅读体验，保持真实内容与既有 URL。
**Architecture:** 博客 layout 复用 HomeLayout/baseOptions；局部覆盖 links 的显示位置以支持手机菜单。列表在服务端按真实分类与 URL 查询参数筛选。详情继续复用共享 MDX 映射，增加 prose、局部表格包装与导航。博客 CSS 均限定在博客 shell 下。
**Tech Stack:** Next.js 16.2.4、React 19、Fumadocs UI 16.8.5/MDX 14.3.2、Tailwind 4、Node 24。
**Spec:** 本文需求与非目标，来源为用户已认可初稿及 2026-10-06 实施授权。

## 基线与授权

- 原 HEAD：fa3ddd3b85b8d4df3d6a468ce358d3689af6956c；work 分支，初始工作区干净。
- git fetch origin main 后以 git merge --ff-only origin/main 安全同步；新 HEAD：fe96f3daa431e1fdd7cbfd6d40c7efc341a50a3e，无冲突或覆盖。
- 上游新增提交修正图片路径与资源，博客渲染、共享 MDX、导航、主题无变更；保留其全部改动。
- 基线 node --test tests/*.test.mjs：28/28 通过。
- 用户指定 GPT-6.1 Sol/high；当前会话仅声明 GPT-6，无可用后端型号/推理配置查询接口，实际型号和推理档不可确认，不能声称已满足。
- 阅读 README、CHANGELOG、.agents/mdx-agent.md、Fumadocs 图片/导航说明及设计/调试/计划/执行/验证技能。项目没有 AGENTS.md 或 CONTEXT.md；共享 .agents、.codex 目录为空，仓库 .agents 仅含 MDX Agent。
- 用户在调查过程中明确授权实施；不重复请求已授权的普通实施选择。
- 初次交付后用户要求「直接在 main 分支上提交即可」。恢复同一环境后 fetch 确认远端 main 仍为 fe96f3d，无新增上游提交；现有 work 分支改名为 main，未新建分支或 PR。提交只包含本任务代码、测试、CHANGELOG 和两份计划/结果文档。

## 需求与非目标

- 仅博客列表及详情改造；首页、文档、文章聚合页、标签页不变。
- 补全到首页、文档、博客的可见导航，覆盖手机菜单。
- 列表保留日期、真实分类、标题、已有 excerpt/description；分类取自真实 frontmatter，显示真实计数。没有摘要时不编造。
- 日期侧栏与正文分区借鉴参考布局；不复制原型配色、假数据、哈希路由或首页热门模块。
- 详情增加首页/博客/当前文章面包屑、确定的返回博客链接、按现有日期倒序列表的上一篇/下一篇。最新/最旧边界不出现占位假链接。
- 保留 getBlogSlug、generateStaticParams、generateMetadata 的语义，未知 slug 404。保留所有 MDX、frontmatter、资源与锚点。
- 博客局部 CSS 使用现有 --color-fd-* 变量，支持明暗主题与 reduced-motion；不更改全局主题或共享 getMDXComponents。
- 不新增假热门/浏览量/阅读时长、不重构搜索、不升级依赖、不改变部署设置、不主动执行部署；后续仅按明确授权直接提交推送 main。

## 参考访问证据与限制

Library ID：libfile_96c786d42a008191bd38e496db3baf1b。
查得原名「dz-notes 首页与博客互联设计.html」，9727 bytes。
prepare_materialize 与当前官方 helper 的首次下载及一次重试均失败；本地 HTML 不存在，未渲染参考。随后 Library read 返回完整 107 行 HTML，可确认其分类 chips、日期侧栏、面包屑、上下篇和手机单列交互。
只借鉴这些结构；不导入其 CSS、米白/绿色变量、示意正文、首页精选/热门数据。
线上样例 https://dz-notes.vercel.app/blog/202607191528 ：web 读取不可达，Chromium 1440px/390px 均 ERR_TUNNEL_CONNECTION_FAILED，无法证明线上当前部署与本地一致。
本地既有生产构建可访问，博客相关源码与同步后基线一致；取得 baseline-built-1440/390.png 与 JSON。旧构建不是 fe96f3d 全量重建，因此最终验证必须基于新构建。

## 根因与证据

### 已确认

1. 导航缺失：src/app/(home)/layout.tsx:1 使用 HomeLayout/baseOptions；src/app/blog 无 layout，src/app/layout.tsx:8 仅 RootProvider/main。blog 不在 (home) 内；列表、详情没有自身回站导航。
2. Typography 遗漏：src/app/blog/[slug]/page.tsx:23 仅 dz-prose；src/app/styles/theme/warm.css:158 仅边框、padding、字号、行高。文档 src/app/docs/(content)/[...slug]/page.tsx:49 用 DocsBody，安装包 layouts/docs/page/index.js 的 DocsBody 添加 prose flex-1。共享 MDX 映射本身并不提供正文 typography。
3. 浏览器本地复现：样例正文 h1/h2 16.8px、font-weight 400、margin 0；ul list-style none、padding 0；th/td padding 0、border 0。与缺少 prose 的 CSS 路径一致。文章含 11 个四列表格、长项目名和说明，不是单纯未编译成 table。
4. 窄屏表格可滚动但列严重挤压：默认 table 映射已经有 overflow-auto；390px 时正文346px、首表约425px，状态列逐字排版。应同时恢复 typography 与博客局部最小表宽，而不是全站隐藏 overflow。
5. 手机导航复用陷阱：baseOptions 的首页/文档/博客都 on:'nav'；HomeLayout 的 menuItems 排除此类项，因此直接新增 layout 仍会漏掉手机导航。只在 blog layout 把这些项改 on:'all'，不修改共享配置。
6. 深层标题的额外缺口：安装版 Fumadocs typography 只定义 h1-h4。真实文章 lombok 的 h5 在补 prose 后仍为16px/400、margin0；补博客局部 h5/h6 600字重与段落间距，保留正文和锚点。

### 组件映射对比

- 博客和文档均调用 src/components/mdx.tsx:25 getMDXComponents。
- pre 均 CodeBlock/Pre，保留 Shiki 亮/暗 github-light/github-dark 与复制按钮；不要另造代码渲染器。
- img 均 ImageZoom 外包原生 img，可容忍远程图无尺寸；不改 next/image 白名单，也不取消缩放。
- table 均 Fumadocs 默认 Table 包装，缺 prose 会缺单元格样式。博客增加自身有标签、可键盘聚焦的滚动区域；文档映射不动。
- 列表、引用、段落、行内代码的 typography 来自 prose，而不是共享映射。
- 文档额外 a:createRelativeLink(source,page)，博客没有：这影响文档相对链接解析，不是本例视觉异常原因。样例为外链/页内锚点，无证据要求博客套文档 source。
- 两集合共享 source.config.ts 的 MDX 编译/代码主题、远程图禁止尺寸 fetch。docs includeProcessedMarkdown 与 blog 的配置差异不决定 JSX 排版。

### 可能问题/尚无复现证据

- 自定义 JSX 可绕过元素映射：已确认 jmeter-simple 的原生 JSX img 无 ImageZoom 包装；验证其响应式显示，并用 font-editor-tools 的 Markdown 图片验证现有缩放。现有博客未发现 Preview/iframe 调用，不能冒充已验证此类真实文章。
- 外部图片可能加载失败，与 layout/CSS 分开记录；不可为此改写内容或下载替换。
- 文章正文保留一级标题，可能与页面标题同时存在；本轮不删除或改写正文标题与锚点。
- 未证明线上任何间歇性 hydration 或 MDX 编译故障；若最终本地验证后用户仍见特定异常，只需追加「元素位置、屏宽、主题」这一最小复现信息。
- 已有 ESLint 10/React 插件不兼容、Vercel 性能未测属于基线记录，不算本轮新增故障。

## 主题复用与兼容性

global.css 先导入 neutral/preset，再导入 warm.css。当前有效浅色 tokens 本身偏暖且 primary 绿色，暗色为灰阶；保留现有 tokens 才能与文档一致。用户要求不套原型配色，因此博客不得引入任何参考 --bg/--ac 色值，也不得为博客重置全站主题。颜色完全从现有 fd 变量派生。
博客 CSS 从新增 layout 引入，并全部以 .dz-blog-shell 限定，覆盖旧 dz-blog 规则；不编辑 warm.css（含其他页使用的 dz-tags/badge）或 global.css。面包屑、卡片 focus、滚动区 focus 使用 fd-ring。代码块保持自身 not-prose 保护、水平滚动和高亮。

## 文件清单

| 文件 | 动作 | 职责 |
| --- | --- | --- |
| src/app/blog/layout.tsx | 新增 | HomeLayout/baseOptions，博客手机 links 局部 all，CSS 入口 |
| src/app/blog/blog.css | 新增 | 列表、面包屑、阅读宽度、上下篇及表格溢出，全部博客限定 |
| src/app/blog/page.tsx | 修改 | searchParams category、真实分类计数、日期侧栏、服务端筛选/空结果 |
| src/app/blog/[slug]/page.tsx | 修改 | 面包屑/返回、prose、上下篇、真实 metadata 与正文 |
| src/components/blog/mdx.tsx | 新增 | 从共享映射派生，仅覆盖博客表格可聚焦滚动区 |
| src/lib/blog-navigation.ts | 新增 | 纯分类统计/筛选/相邻文章逻辑，输入可序列化摘要 |
| tests/blog-navigation.test.mjs | 新增 | 真实业务边界，不执行全部 MDX 或测试源码字符串 |
| CHANGELOG.md | 修改 | 记录本轮行为、验证与限制，不虚报部署 |
| 本计划 | 新增 | 需求、证据、执行与验证记录 |

## Review Focus

1. 组合 category（如 AI, codex）保留完整真实字符串，不擅自拆成标签。
2. query 未知分类/重复参数不报500；全部可复位；刷新与浏览器历史保留 query。
3. 最新、最旧、单篇、未知 slug 不生成错误相邻链接。
4. 窄屏长表格/长代码/长链接不造成整页横向溢出；表格可触摸和键盘滚动。
5. 本地导航切换到非博客页时博客 CSS 不影响其 typography/配色/布局。

## 分阶段步骤

### Task 1：纯数据逻辑
- [x] 用现有 node:test 风格写 categories、filter 与 adjacent 行为测试，观察缺失导出造成失败。
- [x] 实现 getBlogCategories、filterBlogPosts、getAdjacentBlogPosts，基于 {slug,category} 摘要，保持输入顺序且不变更源对象。
- [x] 测试组合分类、空集合、未知分类、首页尾页、单篇、未知 slug；运行全部 suite。

### Task 2：导航与列表
- [x] 取得非博客 baseline 的 DOM/样式指纹及截图。
- [x] 新增 blog layout，复用现有搜索/主题切换，不改 RootProvider 或共享配置；仅博客 on:'all'。
- [x] 列表服务端读取 category 查询，默认全部；基于 Link 的筛选可无 JS 使用，aria-current 标识选中。保留 query 的浏览器前进/后退行为。
- [x] 局部 CSS 日期侧栏在手机变为上方 metadata；只用真实数据，不增加原型首页模块。
- [x] 浏览器检查导航桌面/手机、分类点击/刷新/未知值/历史，标出失败再修复。

### Task 3：详情与排版
- [x] 浏览器断言正文标题字号/字重、list-style、cell padding/border 在基线失败；用 DOM 临时加 prose 验证 CSS 原因，不改产品。
- [x] 加入面包屑、确定的返回 /blog、相邻链接；保留静态 slug 参数、notFound 与 metadata。
- [x] 正文加 prose；派生局部 table 映射提供 aria-label、tabIndex 和 class；长表最小宽度 40rem，区域自己滚动。
- [x] 检查样例、windows-codex-proxy（代码/表格）、jmeter-simple（本地图片）、websocket（远程图/代码）、真实 Preview 示例。

### Task 4：整体验证与交付
- [x] node --test tests/*.test.mjs、types:check、生产 build；pnpm 启动器异常时调用同一脚本的已安装二进制，不升级依赖。
- [x] lint 原命令检查；区分已记录插件兼容失败，不把有类型/构建结果称为 lint 通过。
- [x] 新构建 next start 上跑下述矩阵，保留截图/DOM metrics、HTTP status、console errors。
- [x] 独立代码 review，确认未动内容/非博客/lockfile；更新 CHANGELOG 实际结果。不开新任务；初次交付不提交推送部署，后续 main 集成遵循用户新增授权。
- [x] 保存中文结果文档，Library 保存如受阻则明确提供本地交付路径及完整摘要。

## 验收与测试矩阵

| 范围 | 组合 | 通过信号 |
| --- | --- | --- |
| 博客列表 | 1440/390px × 明/暗 | 真分类/计数、日期层级清晰、长标题换行、整页无横溢出 |
| 导航 | 桌面顶部/手机菜单 | 首页/文档/博客全部能到达，详情博客高亮，主题切换可用 |
| 筛选 | 全部、随笔、AI, codex、未知、重复参数 | 真实匹配、复位、无500、刷新与 Back/Forward 保持 query |
| 详情样例 | 1440/390px × 明/暗 | h1/h2 层级、列表 marker、引用/链接可辨、11表格完整且可横滚 |
| Markdown | h1-h6、嵌套 ul/ol、strong、quote、inline code、hr | 复用 prose，间距/字重恢复，真实内容不变 |
| 代码 | windows-codex-proxy、websocket | syntax highlight 明/暗、复制按钮、长行区域内滚动 |
| 图片/MDX | jmeter-simple、websocket、含 Preview 内容 | 响应式宽度、可缩放、真实 src 保留；远程失败单独记录 |
| 返回/历史 | 直接进入详情、筛选列表进入、首页进入 | 明确返回博客及首页面包屑；浏览器 back 恢复查询；锚点有效 |
| 上下篇 | 最新/最旧/中间、纯函数单篇/未知 | 日期倒序语义，上篇较新下篇较旧，无边界假链接 |
| SEO/路由 | 53篇旧 URL、未知 slug | 原 URL 200、真实标题 description、未知404，无 hash 原型路由 |
| 非博客回归 | /、/docs、文档正文、/articles、/tags，客户端来回 | 原 DOM/关键样式/主题变量指纹一致，无博客样式外泄 |
| 可访问性 | Tab/Enter、表格键盘滚动、reduced-motion | 可见 focus、真实导航标签/当前状态、动画尊重系统设置 |

## 仍需决定项

没有阻塞实施的常规决定。默认完整 category 为筛选单位；显式返回博客回到全部列表，浏览器返回保留原筛选；相邻文章跨分类按现有日期顺序。若用户未来希望多标签拆分、目录侧栏、上下篇仅同分类或来源感知返回，应作为后续范围讨论。本轮不引入。

## 执行记录
全部实施与本地验证完成。参考本地渲染与线上视觉受阻已报告；真实博客没有 Preview/iframe，相关样例项不适用。最终31项测试、构建、6组博客矩阵与10组非博客回归通过；完整结果见 2026-10-06-blog-experience-result.md。初次交付未提交、推送或部署。后续用户明确授权直接提交推送 main；集成结果以 Git 历史及最终回执为准。
