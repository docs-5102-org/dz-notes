import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Hash,
  Layers3,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { getDocChannels } from '@/lib/doc-channels';
import { appName, siteDescription } from '@/lib/site';
import { source } from '@/lib/source';

type SourcePage = ReturnType<typeof source.getPages>[number];

type ArticleSummary = {
  title: string;
  description: string;
  href: string;
  channelSlug: string;
  channelTitle: string;
  dateLabel: string;
  timestamp: number;
  tags: string[];
};

type ChannelSummary = ReturnType<typeof buildChannelSummary>;

function getDisplayTitle(page: SourcePage) {
  return page.data.subTitle?.trim() || page.data.title;
}

function getDisplayDescription(page: SourcePage) {
  return (
    page.data.description?.trim() ||
    '沉淀主题文档、实践记录与可直接复用的知识索引。'
  );
}

function getPageTags(page: SourcePage) {
  const data = page.data as unknown as Record<string, unknown>;
  const tags = data.tags ?? data.tag;

  return Array.isArray(tags)
    ? tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
    : [];
}

function formatTagLabel(tag: string) {
  return tag
    .split(/[-_/]+/)
    .filter(Boolean)
    .map((part) => {
      if (part.length <= 3) return part.toUpperCase();
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
}

function getPageTimestamp(page: SourcePage) {
  const data = page.data as unknown as Record<string, unknown>;
  const value = data.date;

  if (typeof value === 'string' || value instanceof Date) {
    const timestamp = new Date(value).getTime();
    if (!Number.isNaN(timestamp)) return timestamp;
  }

  return 0;
}

function getDateLabel(page: SourcePage) {
  const timestamp = getPageTimestamp(page);
  if (!timestamp) return '持续更新';

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(timestamp));
}

function buildArticleSummary(
  page: SourcePage,
  channelMap: Map<string, ReturnType<typeof getDocChannels>[number]>,
): ArticleSummary | null {
  if (page.slugs.length < 2) return null;

  const channel = channelMap.get(page.slugs[0]);
  if (!channel) return null;

  return {
    title: getDisplayTitle(page),
    description: getDisplayDescription(page),
    href: page.url,
    channelSlug: channel.slug,
    channelTitle: channel.title,
    dateLabel: getDateLabel(page),
    timestamp: getPageTimestamp(page),
    tags: getPageTags(page),
  };
}

function buildTagStats(items: string[]) {
  const counts = new Map<string, number>();

  for (const tag of items) {
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

function buildChannelSummary(
  channel: ReturnType<typeof getDocChannels>[number],
  articles: ArticleSummary[],
) {
  const tagStats = buildTagStats(articles.flatMap((article) => article.tags));

  return {
    ...channel,
    articleCount: articles.length,
    latestArticles: articles.slice(0, 3),
    tagStats: tagStats.slice(0, 4),
  };
}

export default function HomePage() {
  const docChannels = getDocChannels();
  const channelMap = new Map(docChannels.map((channel) => [channel.slug, channel]));

  const allArticles = source
    .getPages()
    .map((page) => buildArticleSummary(page, channelMap))
    .filter((page): page is ArticleSummary => page !== null)
    .sort((a, b) => {
      if (a.timestamp !== b.timestamp) return b.timestamp - a.timestamp;
      return a.href.localeCompare(b.href);
    });

  const channelSummaries: ChannelSummary[] = docChannels
    .map((channel) =>
      buildChannelSummary(
        channel,
        allArticles.filter((article) => article.channelSlug === channel.slug),
      ),
    )
    .filter((channel) => channel.articleCount > 0);

  const featuredArticle = allArticles[0];
  const heroArticles = allArticles.slice(1, 4);
  const latestArticles = allArticles.slice(0, 8);
  const featuredChannels = channelSummaries.slice(0, 8);
  const hotTags = buildTagStats(allArticles.flatMap((article) => article.tags)).slice(0, 12);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0f172a_0%,#111827_36%,#f8fafc_36%,#f8fafc_100%)] text-slate-900">
      <section className="relative overflow-hidden pb-28 pt-8 text-white">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute right-[-6rem] top-8 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6">
          <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
            <Link href="/" className="flex items-center gap-3 text-sm font-semibold tracking-[0.2em]">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-base">
                DZ
              </span>
              <span>{appName}</span>
            </Link>

            <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
              <Link href="/docs" className="transition hover:text-white">
                文档库
              </Link>
              <a href="#channels" className="transition hover:text-white">
                频道
              </a>
              <a href="#latest" className="transition hover:text-white">
                最新更新
              </a>
              <a href="#tags" className="transition hover:text-white">
                热门标签
              </a>
            </nav>
          </header>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
                <Sparkles className="h-4 w-4" />
                Demo12 Style Home
              </div>

              <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                用频道组织知识，用标签串联内容，把主页切到更像 `demo12` 的信息首页。
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                {siteDescription}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {hotTags.slice(0, 6).map((tag) => (
                  <a
                    key={tag.tag}
                    href="#tags"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/10"
                  >
                    <Hash className="h-3.5 w-3.5" />
                    {formatTagLabel(tag.tag)}
                  </a>
                ))}
              </div>

              {featuredArticle ? (
                <Link
                  href={featuredArticle.href}
                  className="group mt-10 block overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.2),rgba(15,23,42,0.72))] p-7 transition hover:border-cyan-300/40 hover:bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(15,23,42,0.82))]"
                >
                  <div className="flex items-center gap-3 text-xs uppercase tracking-[0.28em] text-cyan-200/90">
                    <TrendingUp className="h-4 w-4" />
                    Featured Update
                  </div>
                  <h2 className="mt-4 max-w-3xl text-2xl font-semibold leading-tight text-white sm:text-3xl">
                    {featuredArticle.title}
                  </h2>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                    {featuredArticle.description}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                    <span>{featuredArticle.channelTitle}</span>
                    <span className="text-slate-500">/</span>
                    <span>{featuredArticle.dateLabel}</span>
                    <span className="text-slate-500">/</span>
                    <span>{featuredArticle.tags.slice(0, 2).map(formatTagLabel).join(' · ') || '专题精选'}</span>
                  </div>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-cyan-200 transition group-hover:gap-3">
                    查看文档
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ) : null}
            </div>

            <aside className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur">
              <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-300">
                  <span className="h-5 w-1 rounded-full bg-amber-300" />
                  最新热文
                </h2>
                <Link href="/docs" className="text-sm text-slate-300 transition hover:text-white">
                  全部文档
                </Link>
              </div>

              <div className="space-y-4">
                {heroArticles.map((article, index) => (
                  <Link
                    key={article.href}
                    href={article.href}
                    className="group block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold text-white">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          {article.channelTitle}
                        </p>
                        <h3 className="mt-2 text-base font-medium leading-6 text-white transition group-hover:text-cyan-200">
                          {article.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                          {article.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">内容结构</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-200">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-2xl font-semibold text-white">{channelSummaries.length}</div>
                    <div className="mt-1 text-slate-400">频道</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-2xl font-semibold text-white">{allArticles.length}</div>
                    <div className="mt-1 text-slate-400">文档页</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="channels" className="relative -mt-20 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                Channels
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">动态频道总览</h2>
            </div>
            <Link href="/docs" className="hidden items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950 md:inline-flex">
              浏览全部
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-4">
            {featuredChannels.map((channel) => (
              <Link
                key={channel.slug}
                href={channel.href}
                className="group min-w-[280px] flex-1 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                style={{ boxShadow: `inset 0 1px 0 ${channel.color}` }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
                    style={{ color: channel.color, backgroundColor: 'color-mix(in srgb, white 82%, black 0%)' }}
                  >
                    {channel.title}
                  </span>
                  <span className="text-sm text-slate-400">{channel.articleCount} 篇</span>
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-slate-900">{channel.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                  {channel.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {channel.tagStats.map((tag) => (
                    <span
                      key={tag.tag}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      #{formatTagLabel(tag.tag)}
                    </span>
                  ))}
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  {channel.latestArticles.slice(0, 2).map((article) => (
                    <div key={article.href} className="flex items-center justify-between gap-3 py-2">
                      <span className="line-clamp-1 text-sm text-slate-700">{article.title}</span>
                      <span className="shrink-0 text-xs text-slate-400">{article.dateLabel}</span>
                    </div>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="latest" className="pb-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[minmax(0,1.4fr)_340px]">
          <main>
            <div className="mb-6">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
                Latest Notes
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">按文档页动态拉取的更新流</h2>
            </div>

            <div className="space-y-5">
              {latestArticles.map((article) => (
                <Link
                  key={article.href}
                  href={article.href}
                  className="group flex flex-col gap-5 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-xl md:flex-row"
                >
                  <div className="flex w-full shrink-0 flex-col justify-between rounded-[1.5rem] bg-[linear-gradient(135deg,#e2e8f0_0%,#f8fafc_100%)] p-5 md:w-[240px]">
                    <div
                      className="inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
                      style={{ color: channelMap.get(article.channelSlug)?.color }}
                    >
                      {article.channelTitle}
                    </div>
                    <div className="mt-12 flex items-center gap-2 text-sm text-slate-500">
                      <Clock3 className="h-4 w-4" />
                      {article.dateLabel}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-2xl font-semibold leading-tight text-slate-900 transition group-hover:text-sky-700">
                      {article.title}
                    </h3>
                    <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600 sm:text-base">
                      {article.description}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {(article.tags.length > 0 ? article.tags : [article.channelSlug]).slice(0, 4).map((tag) => (
                        <span
                          key={`${article.href}-${tag}`}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          #{formatTagLabel(tag)}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </main>

          <aside className="space-y-6">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
                  <Layers3 className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">快速入口</h3>
              </div>

              <div className="space-y-3">
                {channelSummaries.slice(0, 6).map((channel) => (
                  <Link
                    key={channel.slug}
                    href={channel.href}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3 transition hover:border-slate-200 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{channel.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{channel.articleCount} 篇内容</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>

            <div id="tags" className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="rounded-2xl bg-amber-50 p-2 text-amber-600">
                  <BookOpen className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">热门标签</h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {hotTags.map((tag) => (
                  <span
                    key={tag.tag}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    <span className="text-slate-400">#</span>
                    {formatTagLabel(tag.tag)}
                    <span className="rounded-md bg-white px-1.5 py-0.5 text-xs text-slate-500">
                      {tag.count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
