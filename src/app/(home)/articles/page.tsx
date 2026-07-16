import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock3, Eye } from 'lucide-react';
import { getArticleBadgeClass, getArticleData } from '@/lib/articles';

export const metadata: Metadata = {
  title: '全部文章',
  description: '按更新时间分页浏览全部文档文章。',
};

const PAGE_SIZE = 12;

type Props = {
  searchParams?: Promise<{
    page?: string | string[];
    tag?: string | string[];
  }>;
};

function getPageNumber(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(raw ?? '1', 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

function getSearchParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || undefined;
}

function getPageHref(page: number, tag?: string) {
  const params = new URLSearchParams();

  if (tag) params.set('tag', tag);
  if (page > 1) params.set('page', String(page));

  const query = params.toString();
  return query ? `/articles?${query}` : '/articles';
}

function getPageItems(currentPage: number, totalPages: number) {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}

export default async function ArticlesPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedTag = getSearchParam(params?.tag);
  const { articles, channelSummaries } = getArticleData();
  const filteredArticles = selectedTag
    ? articles.filter((article) => article.tags.includes(selectedTag))
    : articles;
  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE));
  const currentPage = Math.min(getPageNumber(params?.page), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageArticles = filteredArticles.slice(start, start + PAGE_SIZE);
  const pageItems = getPageItems(currentPage, totalPages);
  const pageTitle = selectedTag ? `#${selectedTag}` : '全部文章';
  const resultDescription = selectedTag
    ? `标签 #${selectedTag} 下共 ${filteredArticles.length} 篇内容。`
    : `按文档更新时间聚合的文章索引，覆盖 ${channelSummaries.length} 个频道，共 ${articles.length} 篇内容。`;

  return (
    <div className="min-h-screen bg-fd-background text-fd-foreground">
      <section className="relative overflow-hidden pb-20 pt-12">
        <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-fd-primary/10 blur-3xl" />
        <div className="absolute right-[-6rem] top-12 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl dark:bg-fd-primary/10" />

        <div className="relative mx-auto max-w-7xl px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-fd-muted-foreground transition hover:text-fd-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>

          <div className="mt-8 flex flex-col justify-between gap-6 rounded-[2rem] border border-fd-border bg-fd-card p-6 shadow-sm md:flex-row md:items-end md:p-8">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-fd-muted-foreground">
                Articles
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-fd-foreground md:text-5xl">
                {pageTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-fd-muted-foreground md:text-base">
                {resultDescription}
              </p>
              {selectedTag ? (
                <Link
                  href="/articles"
                  className="mt-4 inline-flex rounded-full border border-fd-border bg-fd-background px-3 py-1.5 text-xs font-medium text-fd-muted-foreground transition hover:border-fd-muted-foreground hover:text-fd-foreground"
                >
                  查看全部文章
                </Link>
              ) : null}
            </div>
            <div className="rounded-2xl border border-fd-border bg-fd-muted px-4 py-3 text-sm text-fd-muted-foreground">
              第 {currentPage} / {totalPages} 页
            </div>
          </div>
        </div>
      </section>

      <section className="-mt-8 pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pageArticles.map((article) => (
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

                <h2 className="mt-5 line-clamp-2 text-xl font-semibold leading-tight text-fd-foreground transition group-hover:text-fd-primary">
                  {article.title}
                </h2>
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

          {pageArticles.length === 0 ? (
            <div className="rounded-[1.5rem] border border-fd-border bg-fd-card p-8 text-center text-sm text-fd-muted-foreground">
              当前标签下暂无文章。
            </div>
          ) : null}

          <nav className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {currentPage > 1 ? (
              <Link
                href={getPageHref(currentPage - 1, selectedTag)}
                className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-4 py-2 text-sm font-medium text-fd-muted-foreground transition hover:border-fd-muted-foreground hover:text-fd-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                上一页
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-fd-border bg-fd-muted px-4 py-2 text-sm text-fd-muted-foreground/60">
                <ArrowLeft className="h-4 w-4" />
                上一页
              </span>
            )}

            {pageItems.map((page, index) => {
              const previous = pageItems[index - 1];
              const showGap = previous !== undefined && page - previous > 1;

              return (
                <span key={page} className="inline-flex items-center gap-2">
                  {showGap ? <span className="px-1 text-fd-muted-foreground">...</span> : null}
                  <Link
                    href={getPageHref(page, selectedTag)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      page === currentPage
                        ? 'border-fd-primary bg-fd-primary text-fd-primary-foreground'
                        : 'border-fd-border bg-fd-card text-fd-muted-foreground hover:border-fd-muted-foreground hover:text-fd-foreground'
                    }`}
                  >
                    {page}
                  </Link>
                </span>
              );
            })}

            {currentPage < totalPages ? (
              <Link
                href={getPageHref(currentPage + 1, selectedTag)}
                className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-4 py-2 text-sm font-medium text-fd-muted-foreground transition hover:border-fd-muted-foreground hover:text-fd-foreground"
              >
                下一页
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-full border border-fd-border bg-fd-muted px-4 py-2 text-sm text-fd-muted-foreground/60">
                下一页
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </nav>
        </div>
      </section>
    </div>
  );
}
