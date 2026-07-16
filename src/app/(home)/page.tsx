import Link from 'next/link';
import { ArrowRight, BookOpen, Clock3, Eye, Layers3, Tags } from 'lucide-react';
import { BackToTopButton } from '@/components/home/back-to-top-button';
import { RecommendedCarousel } from '@/components/home/recommended-carousel';
import { getArticleBadgeClass, getArticleData } from '@/lib/articles';
import { gitConfig, siteDescription } from '@/lib/site';
import LightRays from '@/components/ui/LightRays/LightRays';
export default function HomePage() {
  const { articles: allArticles, channelSummaries, tagStats } = getArticleData();

  const recommendedArticles = allArticles.slice(0, 5);
  const weeklyArticles = allArticles.slice(0, 3);
  const latestArticles = allArticles.slice(0, 9);
  const featuredChannels = channelSummaries.slice(0, 8);
  const quickEntries = channelSummaries.slice(0, 6);
  const popularTags = tagStats.slice(0, 10);
  const topTagCount = popularTags[0]?.count ?? 1;

  return (
    <div id="top" className="min-h-screen bg-fd-background text-fd-foreground">
      <section className="relative overflow-hidden pb-24 pt-8">
        <div className="absolute inset-x-0 top-0 z-0 h-[560px] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-fd-card)_90%,transparent)_0%,color-mix(in_srgb,var(--color-fd-popover)_72%,transparent)_56%,transparent_100%)]" />
        <div className="absolute left-[-8rem] top-[-6rem] z-0 h-72 w-72 rounded-full bg-fd-primary/12 blur-3xl" />
        <div className="absolute right-[-6rem] top-4 z-0 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl dark:bg-fd-primary/10" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[580px] opacity-2 dark:opacity-100">
          <LightRays
            raysOrigin="top-center"
            raysColor="#1d9e75"
            raysSpeed={0.8}
            lightSpread={0.95}
            rayLength={2.8}
            followMouse={false}
            mouseInfluence={0.05}
            noiseAmount={0.035}
            distortion={0.05}
            pulsating
            fadeDistance={0.9}
            saturation={1.15}
          />
        </div>

        <div className="relative z-[2] mx-auto flex max-w-7xl flex-col gap-12 px-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
            <RecommendedCarousel articles={recommendedArticles} siteDescription={siteDescription} />

            <aside className="rounded-[2rem] border border-fd-border bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-fd-popover)_94%,white_6%)_0%,color-mix(in_srgb,var(--color-fd-card)_88%,var(--color-fd-muted)_12%)_100%)] p-5 text-fd-foreground shadow-[0_24px_60px_rgba(0,0,0,0.10)] md:p-6 dark:text-fd-card-foreground">
              <div className="mb-4 border-b border-fd-border/80 pb-4">
                <h2 className="text-3xl font-semibold tracking-tight text-fd-primary md:text-4xl">
                  本周最热文章
                </h2>
              </div>

              <div className="space-y-4">
                {weeklyArticles.map((article) => (
                  <Link
                    key={article.href}
                    href={article.href}
                    className="group flex items-start gap-4 border-b border-fd-border/70 pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-semibold leading-tight text-fd-foreground transition group-hover:text-fd-primary md:text-2xl dark:text-fd-card-foreground">
                        {article.title}
                      </h3>
                      <p className="mt-4 text-sm text-fd-muted-foreground">
                        {article.channelTitle}
                      </p>
                    </div>

                    <div
                      className="h-24 w-32 shrink-0 rounded-2xl bg-cover bg-center md:h-26 md:w-36"
                      style={{ backgroundImage: `url(${article.image})` }}
                    />
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="channels" className="relative -mt-20 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-fd-muted-foreground">
                Channels
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-fd-foreground">动态频道总览</h2>
            </div>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-4 py-2 text-sm font-medium text-fd-muted-foreground transition hover:border-fd-muted-foreground hover:text-fd-foreground"
            >
              浏览全部
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredChannels.map((channel) => (
              <Link
                key={channel.slug}
                href={channel.href}
                className="group relative min-h-[380px] overflow-hidden rounded-[1.75rem] border border-fd-border bg-fd-card shadow-md transition duration-300 hover:-translate-y-1 hover:border-fd-muted-foreground hover:shadow-xl"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${channel.backgroundImage})` }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04)_0%,rgba(15,23,42,0.10)_40%,rgba(15,23,42,0.78)_100%)] dark:bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.16)_40%,rgba(0,0,0,0.82)_100%)]" />

                <div className="relative flex h-full flex-col justify-end p-6 text-white">
                  <h3 className="text-2xl font-semibold leading-tight md:text-3xl">
                    {channel.title}
                  </h3>
                  <div className="mt-4 flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-black/25 text-xs font-semibold text-white backdrop-blur"
                      style={{ boxShadow: `0 0 0 2px ${channel.color}` }}
                    >
                      {gitConfig.user.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-slate-100">{gitConfig.user}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="latest" className="pb-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <main>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                {/* <p className="text-sm font-medium uppercase tracking-[0.22em] text-fd-muted-foreground">
                  最新文章
                </p> */}
                <h4 className="mt-2 text-3xl font-semibold text-fd-foreground">最新文章</h4>
              </div>
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-4 py-2 text-sm font-medium text-fd-muted-foreground transition hover:border-fd-muted-foreground hover:text-fd-foreground"
              >
                全部文章
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {latestArticles.map((article) => (
                <Link
                  key={article.href}
                  href={article.href}
                  className="group flex min-h-[250px] flex-col rounded-[1.5rem] border border-fd-border bg-fd-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-fd-muted-foreground hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getArticleBadgeClass(article)}`}
                    >
                      {article.channelTitle}
                    </span>
                    <span className="shrink-0 text-xs text-fd-muted-foreground">
                      {article.dateLabel}
                    </span>
                  </div>

                  <h3 className="mt-5 line-clamp-2 text-xl font-semibold leading-tight text-fd-foreground transition group-hover:text-fd-primary">
                    {article.title}
                  </h3>
                  <p className="mt-4 line-clamp-3 flex-1 text-sm leading-7 text-fd-muted-foreground">
                    {article.description}
                  </p>

                  <div className="mt-6 flex items-center gap-4 border-t border-fd-border pt-4 text-xs text-fd-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      {article.readingMinutes} 分钟阅读
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      {article.views.toLocaleString('zh-CN')} 浏览
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </main>

          <aside className="space-y-6">
            {/* <div className="rounded-[1.75rem] border border-fd-border bg-fd-card p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3 border-b border-fd-border pb-4">
                <div className="rounded-2xl bg-fd-secondary p-2 text-fd-foreground">
                  <Layers3 className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-semibold text-fd-foreground">全部频道</h3>
              </div>

              <div className="space-y-3">
                {quickEntries.map((channel) => (
                  <Link
                    key={channel.slug}
                    href={channel.href}
                    className="flex items-center justify-between rounded-2xl border border-fd-border px-4 py-3 transition hover:border-fd-muted-foreground hover:bg-fd-secondary/60"
                  >
                    <div>
                      <p className="font-medium text-fd-foreground">{channel.title}</p>
                      <p className="mt-1 text-xs text-fd-muted-foreground">
                        {channel.articleCount} 篇内容
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-fd-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div> */}

            <div className="rounded-[1.75rem] border border-fd-border bg-fd-card p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3 border-b border-fd-border pb-4">
                <div className="flex items-center gap-3">
                  <Tags className="h-4 w-4 text-fd-foreground" />
                  <h3 className="text-xl font-semibold text-fd-foreground">热门标签</h3>
                </div>
                <Link
                  href="/tags"
                  className="inline-flex items-center gap-1 text-sm font-medium text-fd-muted-foreground transition hover:text-fd-foreground"
                >
                  全部
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-4">
                {popularTags.map((tag, index) => {
                  const width = `${Math.max(8, Math.round((tag.count / topTagCount) * 100))}%`;

                  return (
                    <Link
                      key={tag.tag}
                      href={`/articles?tag=${encodeURIComponent(tag.tag)}`}
                      className="group grid grid-cols-[1.25rem_minmax(0,1fr)_5rem_2rem] items-center gap-3 text-sm"
                    >
                      <span className="text-fd-muted-foreground">{index + 1}</span>
                      <span className="truncate text-base font-semibold text-fd-foreground transition group-hover:text-fd-primary">
                        #{tag.tag}
                      </span>
                      <span className="h-1 overflow-hidden rounded-full bg-fd-border">
                        <span
                          className="block h-full rounded-full bg-fd-primary transition group-hover:bg-fd-foreground"
                          style={{ width }}
                        />
                      </span>
                      <span className="text-right text-sm font-medium text-fd-muted-foreground">
                        {tag.count}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-fd-border bg-fd-card p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3 border-b border-fd-border pb-4">
                <div className="rounded-2xl bg-fd-secondary p-2 text-fd-primary">
                  <BookOpen className="h-4 w-4" />
                </div>
                <h3 className="text-xl font-semibold text-fd-foreground">内容概览</h3>
              </div>

              <div className="space-y-3 text-sm text-fd-muted-foreground">
                <p>频道：{channelSummaries.length}</p>
                <p>文档页：{allArticles.length}</p>
                <p>最近更新：{latestArticles[0]?.dateLabel ?? '持续更新'}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <BackToTopButton />
    </div>
  );
}
