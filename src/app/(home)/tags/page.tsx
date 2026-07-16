import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Search, Tags } from 'lucide-react';
import { getArticleData } from '@/lib/articles';

export const metadata: Metadata = {
  title: '全部标签',
  description: '查看并搜索全部文档标签。',
};

type Props = {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
};

function getSearchParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || '';
}

export default async function TagsPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = getSearchParam(params?.q);
  const { tagStats, articles } = getArticleData();
  const filteredTags = query
    ? tagStats.filter((tag) => tag.tag.toLowerCase().includes(query.toLowerCase()))
    : tagStats;

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

          <div className="mt-8 rounded-[2rem] border border-fd-border bg-fd-card p-6 shadow-sm md:p-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-fd-muted-foreground">
                  Tags
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-fd-foreground md:text-5xl">
                  全部标签
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-fd-muted-foreground md:text-base">
                  从 {articles.length} 篇文档中聚合出 {tagStats.length} 个标签，点击标签可查看对应文章列表。
                </p>
              </div>

              <div className="rounded-2xl border border-fd-border bg-fd-muted px-4 py-3 text-sm text-fd-muted-foreground">
                {query ? `匹配 ${filteredTags.length} 个` : `${tagStats.length} 个标签`}
              </div>
            </div>

            <form action="/tags" className="mt-8 flex flex-col gap-3 sm:flex-row">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fd-muted-foreground" />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="搜索标签，例如 speech、tts、jacob"
                  className="h-12 w-full rounded-full border border-fd-border bg-fd-background pl-11 pr-4 text-sm text-fd-foreground outline-none transition placeholder:text-fd-muted-foreground focus:border-fd-muted-foreground"
                />
              </label>
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-full border border-fd-border bg-fd-primary px-5 text-sm font-medium text-fd-primary-foreground transition hover:opacity-90"
              >
                搜索
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="-mt-8 pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-[1.75rem] border border-fd-border bg-fd-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3 border-b border-fd-border pb-4">
              <div className="rounded-2xl bg-fd-secondary p-2 text-fd-primary">
                <Tags className="h-4 w-4" />
              </div>
              <h2 className="text-xl font-semibold text-fd-foreground">
                {query ? `搜索：${query}` : '标签索引'}
              </h2>
            </div>

            {filteredTags.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {filteredTags.map((tag) => (
                  <Link
                    key={tag.tag}
                    href={`/articles?tag=${encodeURIComponent(tag.tag)}`}
                    className="rounded-full border border-fd-border bg-fd-background px-4 py-2 text-sm font-medium text-fd-muted-foreground transition hover:border-fd-muted-foreground hover:bg-fd-muted hover:text-fd-foreground"
                  >
                    #{tag.tag} · {tag.count}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-fd-border bg-fd-background p-8 text-center text-sm text-fd-muted-foreground">
                没有找到匹配的标签。
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
