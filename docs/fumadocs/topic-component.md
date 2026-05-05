# 专题广场组件说明

这篇文档说明两个文件的职责和协作关系：

- `src/app/docs/(home)/page.tsx`
- `src/components/docs/docs-topics-showcase.tsx`

它们共同实现了文档首页的“专题广场”区域：左侧展示频道列表，右侧展示当前频道的专题卡片和文章卡片。

## 一、整体职责

可以把这套实现拆成两层：

1. **`page.tsx`**
   负责服务端取数、整理频道数据、生成展示模型。
2. **`docs-topics-showcase.tsx`**
   负责客户端交互和界面渲染，包括搜索、切换频道、滚动和卡片展示。

简单理解就是：

- `page.tsx` 负责“准备数据”
- `docs-topics-showcase.tsx` 负责“把数据展示出来”

---

## 二、数据流

当前页面的数据流大致如下：

```text
source.getPages()
  ↓
getDocChannels()
  ↓
buildChannelArticles()
  ↓
sections: DocsTopicSection[]
  ↓
<DocsTopicsShowcase sections={...} />
```

说明：

- `source.getPages()` 提供全站文档页
- `getDocChannels()` 提供顶层频道列表
- `buildChannelArticles()` 按频道整理出右侧文章卡片数据
- 最终把 `sections` 传给 `DocsTopicsShowcase`

详见：[数据流程图](./images/topic-component-overview.png)

---


## 三、page.tsx 说明

```ts
import type { Metadata } from 'next';
import { DocsTopicsShowcase, type DocsTopicSection } from '@/components/docs/docs-topics-showcase';
import { source } from '@/lib/source';
import { docChannels } from '@/lib/site';

export const metadata: Metadata = {
  title: '专题广场',
  description: '按主题组织的文档专题与频道入口。',
};

type Props = {
  searchParams?: Promise<{
    preview?: string; // 唯一的 query 参数，用于开启演示频道预览
  }>;
};

// ─────────────────────────────────────────────
// 辅助函数：取文章的展示标题
// v2 新增：优先读 subTitle 字段，没有才降级到 title
// 使用场景：有些文章的 frontmatter 会设置一个更短的 subTitle
// 专门用于导航卡片展示，比完整 title 更适合截断显示
// ─────────────────────────────────────────────
function getArticleDisplayTitle(
  page: ReturnType<typeof source.getPages>[number] | undefined,
) {
  if (!page) return '';
  return page.data.subTitle ?? page.data.title;
  //            ↑ 优先用 subTitle（卡片专用简短标题）
  //                            ↑ 没有则回退到完整 title
}

// ─────────────────────────────────────────────
// 核心函数：将一个频道下的所有文档页整理成文章卡片列表
//
// 输入：
//   channel  → 当前频道配置（slug / title / href 等）
//   pages    → source.getPages() 返回的全站所有页
//
// 输出：
//   DocsTopicSection['articles']  → 该频道的卡片数组（已排序、已去重）
//
// 关键数据结构：
//   entries         → Map<secondSlug, 卡片>，最终结果容器，自动去重
//   groupedChildren → Map<secondSlug, 深度页[]>，暂存待聚合的深度页
// ─────────────────────────────────────────────
function buildChannelArticles(
  channel: (typeof docChannels)[number],
  pages: ReturnType<typeof source.getPages>,
): DocsTopicSection['articles'] {

  // Step 1: 过滤 → 只留属于当前频道的页
  // slugs[0] 对应 URL 的第一段内容路径
  // /docs/coding/react/hooks → slugs = ['coding','react','hooks']
  // 所以 slugs[0] === 'coding' 即可精确命中 coding 频道
  const channelPages = pages.filter((page) => page.slugs[0] === channel.slug);

  const entries = new Map<string, DocsTopicSection['articles'][number]>();
  const groupedChildren = new Map<string, typeof channelPages>();

  // Step 2: 遍历分类 → 二级页直接入 entries，深度页先暂存
  for (const page of channelPages) {

    // 跳过频道首页本身（/docs/coding）
    // 它在右侧 hero 区单独展示，不作为卡片
    if (page.url === channel.href) continue;

    const secondSlug = page.slugs[1]; // URL 第二段，如 "react"
    if (!secondSlug) continue;        // 防御：没有第二段则跳过

    if (page.slugs.length === 2) {
      // ── 情况 A：二级页 ──────────────────────────────────
      // 路径形如 /docs/coding/react（slugs = ['coding','react']）
      // 这是一篇独立文章，直接生成一张卡片写入 entries
      //
      // v2 变化：title 改用 getArticleDisplayTitle(page)
      // 而不是直接读 page.data.title，支持 subTitle 优先
      entries.set(secondSlug, {
        title: getArticleDisplayTitle(page),          // subTitle ?? title
        description: page.data.description ?? '继续完善这篇文档的内容结构与示例。',
        href: page.url,
        meta: `${channel.title} / ${decodeURI(secondSlug)}`,
        // decodeURI：secondSlug 可能含中文编码（如 %E5%BC%80%E5%A7%8B），解码后展示
      });
      continue;
    }

    // ── 情况 B：深度页 ──────────────────────────────────
    // 路径形如 /docs/coding/react/hooks（slugs.length >= 3）
    // 不单独生成卡片，按 secondSlug 分组暂存
    // 后续会为整组生成一张"聚合卡片"代表这个子目录
    const siblings = groupedChildren.get(secondSlug) ?? [];
    siblings.push(page);
    groupedChildren.set(secondSlug, siblings);
  }

  // Step 3: 处理深度页分组 → 每组生成一张聚合卡片
  for (const [secondSlug, children] of groupedChildren) {

    // ── 去重核心逻辑 ──────────────────────────────────
    // 如果情况 A 已经为这个 secondSlug 写入过卡片
    // （说明 /docs/coding/react 这个二级页实际存在）
    // 则跳过，不让深度页聚合卡片覆盖它
    if (entries.has(secondSlug)) continue;

    // 尝试找这个子目录的"概览页"，即 /docs/coding/react
    // 注意：概览页可能在 channelPages 里没被匹配到（它 slugs.length===2 但前面被 continue 了？）
    // 不，是可能根本不存在这个页面，所以需要 source.getPage 单独查询
    const overviewPage = source.getPage([channel.slug, secondSlug]);

    // 代表页优先级：overviewPage（概览页）> children[0]（第一个子页兜底）
    const representative = overviewPage ?? children[0];

    entries.set(secondSlug, {
      // v2 变化：同样走 getArticleDisplayTitle，且加了 || decodeURI(secondSlug) 兜底
      // 当 representative 存在但 subTitle/title 都为空时，直接用路径段名称
      title: getArticleDisplayTitle(representative) || decodeURI(secondSlug),
      description:
        representative?.data.description ??
        `查看 ${decodeURI(secondSlug)} 分类下的 ${children.length} 篇文档。`,
      href: representative?.url ?? children[0].url,
      // meta 会显示子文档数量，让用户知道这是一个聚合入口而非单篇文章
      meta: `${channel.title} / ${decodeURI(secondSlug)} / ${children.length} 篇文档`,
    });
  }

  // Step 4: Map → 数组，按 href 字母序排序保证展示顺序稳定
  return Array.from(entries.values()).sort((a, b) => a.href.localeCompare(b.href));
}

// ─────────────────────────────────────────────
// 页面主函数（Server Component，运行在服务端）
// ─────────────────────────────────────────────
export default async function DocsHomePage({ searchParams }: Props) {
  const params = await searchParams;

  // 特性开关：?preview=channels 时追加演示频道
  // 用于在真实页面里预览"频道超过 6 个"时的布局密度
  const enableDemoChannels = params?.preview === 'channels';

  const pages = source.getPages(); // 全站文档页，只调用一次避免重复开销

  // 为每个真实频道生成完整的 section 数据
  const sections: DocsTopicSection[] = docChannels.map((channel) => {
    // 频道首页（/docs/coding）→ 用于读取该频道的 description
    const overviewPage = source.getPage([channel.slug]);
    const articles = buildChannelArticles(channel, pages);

    return {
      id: channel.slug,
      title: channel.title,
      // description 优先用首页 frontmatter，其次用 docChannels 里配置的默认值
      description: overviewPage?.data.description ?? channel.description,
      href: channel.href,
      color: channel.color,  // 频道主题色，左侧导航高亮 + 右侧 hero 装饰色
      meta: channel.meta,    // 左侧导航卡片副标题（如"12 篇文档"）
      // picsum 用 slug 作为 seed，同一频道每次返回同一张图
      backgroundImage: `https://picsum.photos/seed/${channel.slug}-topic/1200/720`,
      articleCount: articles.length,
      articles,
    };
  });

  // ── 演示频道（仅 ?preview=channels 时生效）──────────────
  // 目的：测试布局在 10+ 频道时的表现
  // 做法：复用已有频道的文章数据，只替换 id/title/color/meta
  // demoChannels 定义在函数内部（v2 相对 v1 的位置变化，逻辑不变）
  const demoChannels = [ ... ] as const;

  const demoSections: DocsTopicSection[] = demoChannels.map((demo, index) => {
    // 找到要复用的基础频道数据
    const baseSection = sections.find((s) => s.id === demo.base) ?? sections[0];
    const articles = (baseSection?.articles ?? []).map((article, articleIndex) => ({
      ...article,
      meta: `示例频道 / ${demo.title} / ${articleIndex + 1}`, // 替换 meta 标识来源
    }));

    return {
      id: `demo-${demo.id}`,   // 加前缀避免与真实频道 id 冲突
      title: demo.title,
      description: '这是用于预览专题广场导航密度的示例频道...',
      href: baseSection?.href ?? '/docs',
      color: demo.tone,
      meta: `${articles.length} 篇文档 / 示例 ${index + 1}`,
      backgroundImage: `https://picsum.photos/seed/demo-${demo.id}-topic/1200/720`,
      articleCount: articles.length,
      articles,
    };
  });

  return (
    <DocsTopicsShowcase
      sections={enableDemoChannels ? [...sections, ...demoSections] : sections}
    />
  );
}
```

---

## 四、docs-topics-showcase.tsx 说明

```ts
'use client'; // 客户端组件，需要 useState/useRef 等 Hook

// ─────────────────────────────────────────────
// 类型定义（同时 export 供 page.tsx 使用）
// ─────────────────────────────────────────────
export type DocsTopicArticle = {
  title: string;
  description: string;
  href: string;
  meta: string; // 显示在卡片底部的元信息（频道/分类/文档数）
};

export type DocsTopicSection = {
  id: string;
  title: string;
  description: string;
  href: string;
  color: string;        // 频道主题色（CSS 颜色值或 CSS 变量）
  meta: string;         // 左侧导航副标题
  backgroundImage?: string;
  articleCount: number;
  articles: DocsTopicArticle[];
};

// ─────────────────────────────────────────────
// 工具函数：转义正则特殊字符
// 用于搜索高亮：把用户输入安全地嵌入 RegExp
// ─────────────────────────────────────────────
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─────────────────────────────────────────────
// 高亮组件：将文本中匹配搜索词的部分用 <mark> 包裹
// active：当前卡片是否选中（选中态高亮颜色不同）
// ─────────────────────────────────────────────
function HighlightText({ text, query, active }) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return <>{text}</>; // 无搜索词直接返回原文

  // 用捕获组分割，匹配部分也会出现在 parts 数组里
  const parts = text.split(new RegExp(`(${escapeRegExp(normalizedQuery)})`, 'ig'));

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === normalizedQuery.toLowerCase();
        if (!isMatch) return <span key={`${part}-${index}`}>{part}</span>;
        return (
          <mark
            key={`${part}-${index}`}
            className={[
              'rounded px-0.5',
              active
                ? 'bg-fd-primary-foreground/20 text-fd-primary-foreground' // 选中态：反色高亮
                : 'bg-fd-primary/12 text-fd-primary',                       // 普通态：主色淡底
            ].join(' ')}
          >
            {part}
          </mark>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────
// 主组件：整个专题广场页面的 UI
// ─────────────────────────────────────────────
export function DocsTopicsShowcase({ sections }: Props) {
  const router = useRouter();

  // 当前选中的频道 id，默认选第一个
  const [activeTopicId, setActiveTopicId] = useState(sections[0]?.id ?? '');

  // 是否展开超过 6 个的频道列表
  const [showAllTopics, setShowAllTopics] = useState(false);

  // 搜索框输入值
  const [topicQuery, setTopicQuery] = useState('');

  // 当前激活的 section 对象（找不到时兜底 sections[0]）
  const activeSection = sections.find((s) => s.id === activeTopicId) ?? sections[0];

  // 用于搜索框键盘导航时自动滚动到激活按钮
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  // ── 派生状态（全部用 useMemo 缓存）──────────────

  // 搜索过滤：在 title / meta / description 三个字段里做模糊匹配
  const filteredSections = useMemo(() => {
    const query = topicQuery.trim().toLowerCase();
    if (!query) return sections; // 无输入返回全量
    return sections.filter((s) =>
      s.title.toLowerCase().includes(query) ||
      s.meta.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query)
    );
  }, [sections, topicQuery]);

  // 可见频道列表：搜索中显示过滤结果；否则按 showAllTopics 截断到 6 个
  const visibleSections = useMemo(() => {
    if (topicQuery.trim()) return filteredSections;    // 搜索态：显示匹配结果
    if (showAllTopics || sections.length <= 6) return sections; // 展开态或不足6个：全显
    return sections.slice(0, 6);                       // 默认：只显示前 6 个
  }, [filteredSections, sections, showAllTopics, topicQuery]);

  // 推荐频道：无搜索结果时的兜底展示，固定取前 3 个
  const recommendedSections = useMemo(() => sections.slice(0, 3), [sections]);

  const isSearching = topicQuery.trim().length > 0;
  const hasSearchResults = filteredSections.length > 0;

  // 激活频道或展开状态变化时，自动滚动左侧导航到激活按钮
  useEffect(() => {
    activeButtonRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    });
  }, [activeSection?.id, showAllTopics, topicQuery]);

  if (!activeSection) return null;

  // ── 搜索框键盘导航 ──────────────────────────────
  function handleTopicKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (visibleSections.length === 0) return;

    // 在 visibleSections 里找当前激活项的位置
    const currentIndex = visibleSections.findIndex((s) => s.id === activeSection.id);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      // 取模实现循环：最后一个按下去回到第一个
      const next = currentIndex >= 0 ? (currentIndex + 1) % visibleSections.length : 0;
      setActiveTopicId(visibleSections[next].id);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      // 加 length 再取模：防止 -1 % n 在 JS 里出现负数
      const prev = currentIndex >= 0
        ? (currentIndex - 1 + visibleSections.length) % visibleSections.length
        : visibleSections.length - 1;
      setActiveTopicId(visibleSections[prev].id);
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      router.push(activeSection.href); // 直接跳转当前激活频道
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setTopicQuery(''); // 清空搜索，恢复完整列表
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6 md:py-10">
      {/* 两栏布局：左 1 份导航 / 右 3 份内容 */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.5fr_1.5fr] xl:items-start">

        {/* ── 左侧：频道导航面板 ─────────────────── */}
        <aside className="min-w-0">
          <div className="flex h-full flex-col gap-3 rounded-[28px] border ...">

            {/* 统计区：频道数 + 总文档数 */}
            <div className="rounded-[20px] border ...">
              <h2>专题广场</h2>
              {/* isSearching 时显示"搜索结果"或"推荐专题"标签 */}
              {isSearching ? <Badge>{hasSearchResults ? '搜索结果' : '推荐专题'}</Badge> : null}

              {/* 两个数字卡片：频道总数 / 所有文档总数 */}
              <div className="grid grid-cols-2 gap-2.5">
                <StatCard icon={<Layers3/>} label="频道" value={sections.length} />
                <StatCard icon={<BookOpen/>} label="文档"
                  value={sections.reduce((sum, s) => sum + s.articleCount, 0)}
                />
              </div>
            </div>

            {/* 搜索框 */}
            <div className="rounded-[22px] border ...">
              <label className="flex items-center gap-3 ...">
                <Search />
                <input
                  value={topicQuery}
                  onChange={(e) => setTopicQuery(e.target.value)}
                  onKeyDown={handleTopicKeyDown} // 键盘导航绑定在 input 上
                  placeholder="搜索专题频道"
                />
                {/* 有输入时显示清空按钮 */}
                {topicQuery.trim() ? <ClearButton onClick={() => setTopicQuery('')} /> : null}
              </label>
              <p>↑ ↓ 切换专题，Enter 进入频道，Esc 清空搜索</p>
              {isSearching ? <p>找到 {filteredSections.length} 个匹配专题</p> : null}
            </div>

            {/* 频道按钮列表 */}
            <div className="flex flex-col gap-3">
              {visibleSections.map((section) => {
                const isActive = section.id === activeSection.id;

                // 激活态：边框和背景用频道主题色混合
                const activeCardStyle = isActive ? {
                  borderColor: section.color,
                  // color-mix：16% 频道色 + 84% 卡片底色，兼容暗色模式
                  background: `color-mix(in srgb, ${section.color} 16%, var(--color-fd-card) 84%)`,
                } : undefined;

                // 激活态徽章：纯频道色背景
                const activeBadgeStyle = isActive ? {
                  backgroundColor: section.color,
                  color: 'var(--color-fd-primary-foreground)',
                } : undefined;

                return (
                  <button
                    ref={isActive ? activeButtonRef : null} // 只有激活项挂 ref 用于滚动
                    key={section.id}
                    onClick={() => setActiveTopicId(section.id)}
                    style={activeCardStyle}
                    className={isActive ? 'shadow-...' : 'border-fd-border ... hover:...'}
                  >
                    {/* 左侧：频道色圆点 + 标题 + meta */}
                    <span>
                      <span style={{ backgroundColor: section.color }} className="rounded-full" />
                      <span>
                        <HighlightText text={section.title} query={topicQuery} active={isActive} />
                        <HighlightText text={section.meta}  query={topicQuery} active={isActive} />
                      </span>
                    </span>
                    {/* 右侧：文章数量徽章 */}
                    <span style={activeBadgeStyle}>{section.articleCount}</span>
                  </button>
                );
              })}
            </div>

            {/* 搜索无结果时的兜底：推荐专题列表 */}
            {visibleSections.length === 0 ? (
              <div>
                <p>没有匹配到专题频道。</p>
                <p>推荐专题</p>
                {recommendedSections.map((section) => (
                  <button key={section.id} onClick={() => {
                    setTopicQuery('');           // 清空搜索
                    setActiveTopicId(section.id); // 切换到推荐频道
                  }}>
                    {section.title}
                  </button>
                ))}
              </div>
            ) : null}

            {/* 展开/收起按钮：仅在非搜索态且频道 > 6 时显示 */}
            {!isSearching && !showAllTopics && sections.length > 6 ? (
              <button onClick={() => setShowAllTopics(true)}>展开全部频道 <ChevronDown/></button>
            ) : null}
            {!isSearching && showAllTopics && sections.length > 6 ? (
              <button onClick={() => setShowAllTopics(false)}>收起部分频道 <ChevronDown className="rotate-180"/></button>
            ) : null}
          </div>
        </aside>

        {/* ── 右侧：频道内容面板 ─────────────────── */}
        <div className="min-w-0">
          <div className="rounded-[32px] border ...">

            {/* Hero 区：频道标题 + 背景图 + 文档数统计 + 进入按钮 */}
            <div className="relative overflow-hidden rounded-[30px] ...">
              {activeSection.backgroundImage ? (
                <>
                  {/* 背景图层 */}
                  <div style={{ backgroundImage: `url(${activeSection.backgroundImage})` }} />
                  {/* 半透明遮罩：亮色模式 rgba(247,244,238) / 暗色模式 rgba(18,18,18) */}
                  <div className="absolute inset-0 bg-[linear-gradient(...)] dark:bg-[linear-gradient(...)]" />
                </>
              ) : (
                // 无背景图时：用频道色做模糊光晕装饰
                <div style={{ backgroundColor: activeSection.color }} className="blur-2xl opacity-70" />
              )}

              {/* 内容区（relative 确保在遮罩层之上）*/}
              <div className="relative flex h-full flex-col">
                <p>Topic Brief</p>
                <h2>{activeSection.title} 专题索引</h2>
                <p>这里收拢该主题下的核心文档与入门路径...</p>

                {/* 底部：文档数 + 进入频道按钮 */}
                <div className="mt-auto border-t ...">
                  <div>{activeSection.articleCount}</div>
                  <Link href={activeSection.href}>进入频道 <ArrowRight/></Link>
                </div>
              </div>
            </div>

            {/* 分隔线（渐变效果）*/}
            <div className="h-px bg-[linear-gradient(90deg,transparent,var(--color-fd-border),transparent)]" />

            {/* v2 变化：文章卡片区 ────────────────────────
                v1：featured 大卡 + 右侧小卡堆叠（xl:grid-cols-[1.25fr_0.95fr]）
                v2：统一的 3 列网格（md:grid-cols-2 xl:grid-cols-3）
                好处：每张卡片等宽，布局更规整，适合文章数量不固定的场景
            */}
            {activeSection.articles.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {activeSection.articles.map((article) => (
                  <Link key={article.href} href={article.href}
                    className="group rounded-[24px] border ... hover:-translate-y-1 hover:shadow-..."
                  >
                    {/* 顶部：频道名 + 箭头（hover 时箭头右移） */}
                    <div>
                      <span>{activeSection.title}</span>
                      <ArrowRight className="group-hover:translate-x-1" />
                    </div>

                    {/* 文章标题（hover 变主色） */}
                    <h3 className="group-hover:text-fd-primary">{article.title}</h3>

                    {/* 描述（最多 3 行，超出省略） */}
                    <p className="line-clamp-3">{article.description}</p>

                    {/* 底部 meta（频道/分类/文档数） */}
                    <p className="border-t ...">{article.meta}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div>当前专题还没有可展示的文档卡片。</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 7. 滚动与吸附

当前实现里有两个比较关键的 UI 设计：

#### 左侧

- 搜索框区域是吸附的
- 频道列表区域独立滚动

#### 右侧

- 顶部专题卡片是吸附的
- 下方文章卡片区域独立滚动

这样做的好处是：

- 搜索框始终可见
- 右侧频道信息不会滚走
- 左右两栏滚动行为独立，浏览体验更稳定

---

## 五、右侧内容区结构

右侧内容区可以理解为两层：

### 1. 专题索引头部卡片

这里显示当前频道的：

- 标题
- 简介
- 收录文档数
- 进入频道按钮
- 背景图或主题色装饰

这部分决定了当前频道的视觉识别。

### 2. 文章卡片列表

这部分展示当前频道下整理出来的文章列表。

每张卡片包含：

- 文章标题
- 描述
- 元信息

当前布局是统一的网格卡片，不再区分“精选大卡”和“普通小卡”。

这样做的优点是：

- 布局更整齐
- 扩展更多文章时更稳定
- 各频道展示风格更统一

---

## 六、当前实现的几个关键点

### 1. 频道来源已经改成动态获取

当前 `page.tsx` 不再依赖旧的静态频道常量，而是使用：

```ts
const docChannels = getDocChannels();
```

这意味着：

- 顶层频道来自文档目录结构
- 频道标题和描述优先读取 `index.mdx` frontmatter
- 只要补齐频道目录和 `meta.json`，首页专题广场就能自动接入

### 2. 文章标题优先使用 `subTitle`

这是现在卡片标题展示的一条重要规则：

- 如果文章配置了 `subTitle`，就优先显示
- 没有才回退到 `title`

这能避免卡片上显示过长标题。

### 3. 右侧卡片是按二级目录聚合的

这不是“把所有三级文章全列出来”的模式，而是：

- 二级页面直接作为卡片
- 没有二级页面时，用该二级目录下的深层文章聚合成一个卡片

所以这个首页更像“专题入口页”，不是完整目录树。

---

## 七、适合修改的位置

如果后续要继续调这个区域，通常按下面分工处理就够了。

### 改数据结构或频道生成逻辑

改：

- `src/app/docs/(home)/page.tsx`

适合的修改：

- 调整文章聚合规则
- 修改卡片标题来源
- 修改频道描述来源
- 增加或删除 demo 频道逻辑

### 改布局、样式、滚动、吸附行为

改：

- `src/components/docs/docs-topics-showcase.tsx`

适合的修改：

- 左右栏比例
- 搜索框样式
- 右侧头图卡高度
- 卡片网格列数
- 独立滚动区域高度
- sticky 行为

---

## 八、总结

这套专题广场的实现思路很明确：

- `page.tsx` 负责把文档源整理成统一的频道数据
- `docs-topics-showcase.tsx` 负责把这些频道数据渲染成可交互界面

如果把它看成一个模块：

- 服务端层解决“数据怎么组织”
- 客户端层解决“界面怎么浏览”

后续无论继续扩展频道，还是继续微调交互和视觉，基本都可以沿着这个边界继续维护。 