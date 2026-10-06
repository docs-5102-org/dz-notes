# dz-notes 博客改造交付结果（2026-10-06）

已在用户选择的 dz-notes 云环境完成博客改造。初次交付保持未提交；用户随后明确授权直接 commit/push 到 main，无需分支或 PR。集成状态以 Git 历史及最终回执为准；没有另发部署命令或修改部署设置。完整需求、只读调查证据、实施文件和验收矩阵见同目录的 `2026-10-06-blog-experience.md`。

## 基线与运行状态

- 仓库：docs-5102-org/dz-notes，目录 /workspace/dz-notes，原分支 work；后续集成直接将其改名为 main。
- 原 HEAD：fa3ddd3b85b8d4df3d6a468ce358d3689af6956c。
- 先确认初始工作区干净，再 fetch origin main 并 merge --ff-only；同步后 HEAD：fe96f3daa431e1fdd7cbfd6d40c7efc341a50a3e。没有分叉、冲突或覆盖他人修改。
- 保留上游新增的文章图片路径修正及全部资源；本轮没有修改 content、public、package.json、pnpm-lock.yaml、全局主题、共享 MDX 或共享导航配置。
- 15:45 UTC 收到断连通知后，15:46 UTC 通过当前环境实际命令确认所有文件与证据仍可读取；最终构建 exit 0。已保存 checkpoint.zip，继续剩余验证，没有切换环境或重做实现。
- 用户指定 GPT-6.1 Sol/high。主执行会话仅声明 GPT-6，没有可用实际后端型号/推理档查询接口，无法核实是否符合指定值。独立审阅任务明确配置 gpt-6.1-sol/high，但这不能证明主任务后端配置相同。

## 实现结果

1. 博客新增 HomeLayout，复用站点标题、首页/文档/博客链接、搜索和主题切换。仅博客把 on:'nav' 改为 on:'all'，解决直接复用后手机菜单缺少导航的问题。
2. 列表改为日期侧栏与文章信息分区，手机显示单列。分类及计数来自 53 篇真实文章；使用 category 查询参数，支持刷新、前进/后退及未知分类空结果。组合分类（如 AI, codex）保留原字符串，没有拆分或新增标签。无摘要的文章不生成假摘要。
3. 详情新增首页/博客/当前文章面包屑、明确返回博客、分类入口和上一篇/下一篇。上一篇较新、下一篇较旧，沿用现有日期倒序，边界不生成假链接。
4. 正文复用共享 getMDXComponents 并添加 prose；仅派生博客 table 为有名称、可聚焦的滚动区域。长表格最小宽度 40rem，手机横向滚动，不再把多列强行挤到窄屏。
5. 博客内补齐 h5/h6 字重和间距。保留共享代码高亮、复制与可聚焦滚动区域；保留 Markdown 图片的 ImageZoom。原生 JSX img 保持其现有行为并适配容器宽度。
6. 所有新增 CSS 均限定在 .dz-blog-shell 下，颜色来自现有 --color-fd-* 变量，未引入参考 HTML 的配色或假数据。

## 确认的根因

| 问题 | 源码/实际证据 | 本轮处理 |
| --- | --- | --- |
| 博客缺少站点导航 | blog 不在 (home) 路由组且无 layout；根 layout 只有 RootProvider/main | 新增博客 layout 复用 HomeLayout |
| 直接复用手机仍缺导航 | baseOptions 的三项链接 on:'nav'，HomeLayout menuItems 排除此类链接 | 仅博客设为 all |
| 标题、列表、引用、表格没有 typography | 博客仅 dz-prose；文档 DocsBody 加 prose。样例 h2 16.8px/400，ul none，td padding0 | 添加 prose，保持映射与正文 |
| 长表格手机阅读困难 | 默认 table 已 overflow-auto；缺 typography 时没有 padding/边框且状态逐字换行 | 恢复 typography、局部最小表宽、可聚焦 region |
| 深层标题仍像段落 | 安装版 typography 只定义 h1-h4；真实 lombok h5 16px/400、margin0 | 博客局部 h5/h6 样式 |
| 代码键盘滚动曾退化 | 独立审阅发现 pre max-width/overflow 把滚动转移到不可聚焦内部层 | 移除这两项覆盖，红绿验证并测试真实 websocket |

样例 content/blog/202607191528.mdx 的正文与 11 个四列表格全部保留。新构建 h2 为 24px/600，ul 为 disc，td padding 为 10px、边框 1px。390px 屏幕滚动区域宽346px、表格内容宽640px；320px 区域宽276px，整页无横向溢出。

并非所有内容差异都是 prose 原因：jmeter-simple 使用原生 JSX img，绕过 img 映射；用它检查真实本地图片和响应式显示，用 font-editor-tools 的 Markdown 图检查缩放。现有博客未发现 Preview/iframe 实例，未声称验证过这些实际用例。博客没有文档的 createRelativeLink(source,page)，样例仅外链/页内锚点，无证据把该差异当作排版根因。

## 文件清单

| 文件 | 变更 |
| --- | --- |
| src/app/blog/layout.tsx | 新增博客站点布局与手机导航 |
| src/app/blog/blog.css | 新增局部列表、详情、排版、表格与响应式样式 |
| src/app/blog/page.tsx | 真实分类筛选/计数、日期布局与空结果 |
| src/app/blog/[slug]/page.tsx | 面包屑/返回/相邻文章、prose |
| src/components/blog/mdx.tsx | 派生博客表格包装，共享其余映射 |
| src/lib/blog-navigation.ts | 纯分类/筛选/相邻文章逻辑 |
| tests/blog-navigation.test.mjs | 三项业务回归测试 |
| CHANGELOG.md | 实际行为、验证范围及限制 |
| docs/superpowers/plans/2026-10-06-blog-experience.md | 完整计划与调查 |
| docs/superpowers/plans/2026-10-06-blog-experience-result.md | 本结果 |

源代码可通过当前工作区 diff 审阅。交付包同时包含 tracked 及 untracked 文件的完整 review.patch。

## 验证结果

| 检查 | 结果 |
| --- | --- |
| 初始全部测试 | 28/28 通过 |
| 新增纯函数测试 | 先观察缺少模块失败，再实现；组合分类/顺序/引用/空集合/未知分类/相邻边界覆盖 |
| 最终全部测试 | node --test tests/*.test.mjs，31/31，exit0 |
| TypeScript | 路由 typegen、tsc 与最终 build 的 TypeScript 均通过 |
| 完整生产构建 | 重新生成搜索快照987页后构建；最终2866静态页，exit0 |
| 53个旧博客 URL | 最终新构建全部200；完整逐URL结果见 evidence/url-results.json |
| 未知文章 | 浏览器验证404 |
| 6组博客矩阵 | 1440/390/320px × 明/暗，全部通过，无 JS pageerror |
| 分类与历史 | 全部、随笔20篇、AI, codex1篇、未知分类、重复参数取首值；刷新、Back/Forward、返回博客通过 |
| Markdown | 真实标题、列表、引用、表格、锚点；lombok真实h5通过，h6用CSS元素探针验证 |
| 代码 | windows-codex-proxy复制剪贴板、真实websocket长代码region方向键横滚通过 |
| 图片 | jmeter-simple本地图片均加载且无整页溢出；font-editor-tools图片缩放/退出通过 |
| 表格 | 样例11表格完整；手机region可通过ArrowRight横滚 |
| 减少动画 | reduced-motion下列表transition为0s |
| 非博客 | /、/docs、指定文档正文、/articles、/tags × 明/暗，10份DOM文本/关键样式/主题变量与基线完全一致；经客户端往返博客后验证 |
| 改动范围 | git diff --exit-code 验证内容/资源/共享主题/共享MDX/依赖未改变；git diff --check通过 |
| 独立审阅 | 无Critical，1项Important已修复；无未处理minor |

原 ESLint 10 完整 lint 未通过：全站检查 scopeManager.addGlobals 错误；未修改共享 MDX 单文件也复现 React 插件 getFilename 错误，属于既有兼容问题。环境已有 ESLint 9 对本轮产品路径检查通过，未修改项目依赖，不能据此声称原 lint 全站通过。

初次构建遇到原有 OG 字体直连超时；查证 Node24 未自动使用现有环境代理，启用 NODE_USE_ENV_PROXY=1 后字体请求实测200，最终完整构建通过。仅调整运行时环境，未改产品代码。构建仍有既有 metadataBase 默认值提示。

## 截图和证据

evidence/ 包含列表、详情、长表格、代码、本地图片的桌面/手机明暗截图，以及原排版截图、DOM/样式对比、浏览器矩阵和53 URL状态。优先查看：

- list-1440-light.png / list-1440-dark.png
- list-390-light.png / list-390-dark.png
- article-1440-light.png / article-1440-dark.png
- article-390-light.png / article-390-dark.png
- table-390-light.png / table-390-dark.png
- baseline-built-1440.png / baseline-built-390.png
- browser-results.json、typography-probe.json、url-results.json
- checks/browser-final.log、checks/build-final.log、checks/final-tests.log
- checks/code-scroll-red.log 与 checks/code-scroll-green.log

浏览器自动化脚本及检查点保存在 /workspace/blog-investigation。交付包不包含 .env、认证信息或 Library 下载地址。

## 限制与后续

- 参考 Library ID libfile_96c786d42a008191bd38e496db3baf1b，原名「dz-notes 首页与博客互联设计.html」、9727 bytes。已读完整107行 HTML 源码，借鉴分类、日期分区、面包屑和上下篇结构。官方下载及一次重试均失败，本地参考渲染未完成，不能声称已视觉对照参考。
- 线上 https://dz-notes.vercel.app/blog/202607191528 在 web/Chromium/Node访问受阻，桌面与手机均未取得线上截图。以上结论来自本地最终生产构建；未证明线上部署与当前源码相同。
- 未验证远程图片持续可达性、全站所有自定义 JSX、Safari/iOS 真机或 Vercel 冷启动性能；这些不作为此次已修复问题。
- 当前有效浅色主题本身偏暖且 primary 为绿色，暗色灰阶；本轮继承现有站点 tokens，与文档保持一致，没有导入原型颜色，也没有更换全站主题。
- 当前实现使 /blog 列表因查询参数筛选成为动态服务端页面，详情继续按原 slug 静态生成。只读取文章摘要，不加载全量正文。
- 分类按完整字符串精确匹配；显式返回博客回到全部列表，浏览器返回保留筛选；相邻文章跨分类按既有日期顺序。没有新增需要阻塞交付的决策。
- 用户已追加明确授权直接 commit/push 到 main。恢复当前环境后 fetch 确认 origin/main 仍为 fe96f3d，无新增上游内容或冲突。重新执行31项测试、路由 typegen、tsc、环境已有 ESLint 9 与完整生产构建均通过（2866静态页，exit0）；Git 提交及 CI 的最终状态见回执。不会 force push、丢弃用户修改、创建 PR 或另发部署命令。

## 执行中的判断

1. 使用用户已选云环境的 work 分支，没有再建 worktree；避免变更所选工作环境。
2. 初次交付遵循禁止提交，提供未提交 diff；后续直接集成 main 依据用户新增明确授权，不重复询问集成菜单。
3. pnpm 启动器试图写不可写目录，改用已安装 CLI 执行同等脚本；没有新增依赖。
4. Node 构建启用现有环境代理；若其他环境没有代理，可使用其正常构建配置，不修改站点配置。
5. 原生 JSX 图片与 Markdown 图片分别验证，不把既有原生图片无缩放视作此次回归；暂无真实 Preview/iframe 样例。
