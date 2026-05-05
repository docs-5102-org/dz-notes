'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Layers3, Search, X } from 'lucide-react';

export type DocsTopicArticle = {
  title: string;
  description: string;
  href: string;
  meta: string;
};

export type DocsTopicSection = {
  id: string;
  title: string;
  description: string;
  href: string;
  color: string;
  meta: string;
  backgroundImage?: string;
  articleCount: number;
  articles: DocsTopicArticle[];
};

type Props = {
  sections: DocsTopicSection[];
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightText({
  text,
  query,
  active,
}: {
  text: string;
  query: string;
  active: boolean;
}) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return <>{text}</>;

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
                ? 'bg-fd-primary-foreground/20 text-fd-primary-foreground'
                : 'bg-fd-primary/12 text-fd-primary',
            ].join(' ')}
          >
            {part}
          </mark>
        );
      })}
    </>
  );
}

const PANEL_HEIGHT = 'min(960px, calc(100vh - 6rem))';

// const PANEL_HEIGHT = '800px';

export function DocsTopicsShowcase({ sections }: Props) {
  const router = useRouter();
  const [activeTopicId, setActiveTopicId] = useState(sections[0]?.id ?? '');
  const [topicQuery, setTopicQuery] = useState('');
  const activeButtonRef = useRef<HTMLButtonElement>(null);

  const filteredSections = useMemo(() => {
    const query = topicQuery.trim().toLowerCase();
    if (!query) return sections;

    return sections.filter((section) => {
      return (
        section.title.toLowerCase().includes(query) ||
        section.meta.toLowerCase().includes(query) ||
        section.description.toLowerCase().includes(query)
      );
    });
  }, [sections, topicQuery]);

  const activeSection =
    filteredSections.find((section) => section.id === activeTopicId) ??
    sections.find((section) => section.id === activeTopicId) ??
    filteredSections[0] ??
    sections[0];

  const isSearching = topicQuery.trim().length > 0;
  const hasSearchResults = filteredSections.length > 0;
  const recommendedSections = useMemo(() => sections.slice(0, 3), [sections]);

  useEffect(() => {
    if (!activeSection && filteredSections[0]) {
      setActiveTopicId(filteredSections[0].id);
      return;
    }

    activeButtonRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    });
  }, [activeSection, filteredSections]);

  if (!activeSection) return null;

  function handleTopicKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (filteredSections.length === 0) return;

    const currentIndex = filteredSections.findIndex((section) => section.id === activeSection.id);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % filteredSections.length : 0;
      setActiveTopicId(filteredSections[nextIndex].id);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex =
        currentIndex >= 0
          ? (currentIndex - 1 + filteredSections.length) % filteredSections.length
          : filteredSections.length - 1;
      setActiveTopicId(filteredSections[prevIndex].id);
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      router.push(activeSection.href);
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setTopicQuery('');
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6 md:py-10">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-stretch">
        <aside className="min-w-0 lg:self-stretch">
          <div
            className="flex h-full min-h-0 flex-col gap-3 rounded-[28px] border border-fd-border bg-fd-card p-5 shadow-[0_18px_40px_rgba(0,0,0,0.08)]"
            style={{ height: PANEL_HEIGHT }}
          >
            <div className="shrink-0 rounded-[20px] border border-fd-border bg-fd-card/50 p-3.5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-fd-muted-foreground">
                  专题广场
                </h2>
                {isSearching ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-2.5 py-1 text-[11px] font-semibold text-fd-muted-foreground">
                    <span className="inline-flex h-2 w-2 rounded-full bg-fd-primary" />
                    {hasSearchResults ? '搜索结果' : '推荐专题'}
                  </div>
                ) : null}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-fd-border bg-fd-card/80 p-2.5">
                  <div className="flex items-center gap-2 text-fd-muted-foreground">
                    <Layers3 className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium uppercase tracking-[0.14em]">频道</span>
                  </div>
                  <div className="mt-1 text-base font-semibold text-fd-foreground">
                    {sections.length}
                  </div>
                </div>

                <div className="rounded-xl border border-fd-border bg-fd-card/80 p-2.5">
                  <div className="flex items-center gap-2 text-fd-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium uppercase tracking-[0.14em]">文档</span>
                  </div>
                  <div className="mt-1 text-base font-semibold text-fd-foreground">
                    {sections.reduce((sum, section) => sum + section.articleCount, 0)}
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky top-0 z-10 shrink-0 -mx-1 rounded-[22px] border border-fd-border bg-fd-card/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-fd-card/80">
              <label className="flex items-center gap-3 rounded-2xl border border-fd-border bg-fd-card px-4 py-3 text-fd-muted-foreground focus-within:border-fd-muted-foreground">
                <Search className="h-4 w-4" />
                <input
                  value={topicQuery}
                  onChange={(event) => setTopicQuery(event.target.value)}
                  onKeyDown={handleTopicKeyDown}
                  placeholder="搜索专题频道"
                  className="w-full bg-transparent text-sm text-fd-foreground outline-none placeholder:text-fd-muted-foreground"
                />
                {topicQuery.trim() ? (
                  <button
                    type="button"
                    aria-label="清空搜索"
                    onClick={() => setTopicQuery('')}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-fd-muted-foreground transition hover:bg-fd-muted hover:text-fd-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </label>
              <p className="px-2 pt-2 text-xs text-fd-muted-foreground">
                ↑ ↓ 切换专题，Enter 进入频道，Esc 清空搜索
              </p>
              {isSearching ? (
                <p className="px-2 pt-1 text-xs text-fd-muted-foreground">
                  找到 {filteredSections.length} 个匹配专题
                </p>
              ) : null}
            </div>

            {filteredSections.length > 0 ? (
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="flex flex-col gap-3">
                  {filteredSections.map((section) => {
                    const isActive = section.id === activeSection.id;
                    const activeCardStyle = isActive
                      ? {
                          borderColor: section.color,
                          background: `color-mix(in srgb, ${section.color} 16%, var(--color-fd-card) 84%)`,
                          color: 'var(--color-fd-foreground)',
                        }
                      : undefined;
                    const activeBadgeStyle = isActive
                      ? {
                          backgroundColor: section.color,
                          color: 'var(--color-fd-primary-foreground)',
                        }
                      : undefined;

                    return (
                      <button
                        ref={isActive ? activeButtonRef : null}
                        key={section.id}
                        type="button"
                        onClick={() => setActiveTopicId(section.id)}
                        style={activeCardStyle}
                        className={[
                          'group flex items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition-all',
                          isActive
                            ? 'shadow-[0_12px_30px_rgba(0,0,0,0.12)]'
                            : 'border-fd-border bg-fd-card/75 text-fd-foreground hover:-translate-y-0.5 hover:border-fd-muted-foreground hover:bg-fd-card',
                        ].join(' ')}
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-3">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: section.color }}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              <HighlightText
                                text={section.title}
                                query={topicQuery}
                                active={isActive}
                              />
                            </span>
                            <span
                              className={[
                                'mt-1 block truncate text-xs',
                                isActive
                                  ? 'text-fd-popover-foreground'
                                  : 'text-fd-muted-foreground',
                              ].join(' ')}
                              title={section.meta}
                            >
                              <HighlightText
                                text={section.meta}
                                query={topicQuery}
                                active={isActive}
                              />
                            </span>
                          </span>
                        </span>

                        <span
                          style={activeBadgeStyle}
                          className={[
                            'inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-full px-2 py-1 text-xs font-semibold',
                            isActive ? '' : 'bg-fd-muted text-fd-muted-foreground',
                          ].join(' ')}
                        >
                          {section.articleCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-fd-border bg-fd-card/60 px-4 py-5">
                <p className="text-center text-sm text-fd-muted-foreground">没有匹配到专题频道。</p>
                <div className="mt-4 flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fd-muted-foreground">
                    推荐专题
                  </p>
                  {recommendedSections.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => {
                        setTopicQuery('');
                        setActiveTopicId(section.id);
                      }}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-fd-border bg-fd-card px-4 py-3 text-left transition hover:border-fd-muted-foreground hover:bg-fd-card"
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: section.color }}
                        />
                        <span>
                          <span className="block text-sm font-semibold text-fd-foreground">
                            {section.title}
                          </span>
                          <span className="mt-1 block text-xs text-fd-muted-foreground">
                            {section.meta}
                          </span>
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-fd-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 lg:self-stretch">
          <div
            className="flex h-full min-h-0 flex-col rounded-[32px] border border-fd-border bg-fd-card p-6 shadow-[0_24px_60px_rgba(0,0,0,0.08)] md:p-8"
            style={{ height: PANEL_HEIGHT }}
          >
            <div
              className={[
                'sticky top-0 z-10 relative shrink-0 overflow-hidden rounded-[30px] border border-fd-border p-5 md:p-6',
                activeSection.backgroundImage ? 'bg-fd-card' : 'bg-fd-background',
              ].join(' ')}
            >
              {activeSection.backgroundImage ? (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${activeSection.backgroundImage})` }}
                  />
                  {/* 
                    背景渲染效果：
                    更浅一点：bg-[linear-gradient(180deg,rgba(247,244,238,0.88),rgba(247,244,238,0.94))]
                    更明显一点：bg-[linear-gradient(180deg,rgba(247,244,238,0.50),rgba(247,244,238,0.94))]
                  */}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,244,238,0.50),rgba(247,244,238,0.94))] dark:bg-[linear-gradient(180deg,rgba(18,18,18,0.76),rgba(18,18,18,0.88))]" />
                </>
              ) : (
                <div
                  className="absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-10 blur-2xl"
                  style={{ backgroundColor: activeSection.color }}
                />
              )}
              <div className="relative flex flex-col gap-4">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fd-muted-foreground">
                    Topic Brief
                  </p>
                  <h2 className="mt-2 text-[1.7rem] font-bold leading-tight tracking-[-0.04em] text-fd-foreground md:text-[2rem]">
                    {activeSection.title} 专题索引
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-fd-popover-foreground md:text-[15px]">
                    这里收拢该主题下的核心文档与入门路径，适合先建立全局认知，再深入到具体文章。
                  </p>
                </div>
                {/* 标题和小时下方的标签 */}
                {/* <div className="flex flex-wrap gap-2.5">
                  <span className="rounded-full border border-fd-border bg-fd-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-fd-muted-foreground">
                    {activeSection.title}
                  </span>
                  <span className="rounded-full border border-fd-border bg-fd-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-fd-muted-foreground">
                    深入阅读
                  </span>
                </div> */}

                <div className="border-t border-fd-border/80 pt-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="rounded-2xl border border-fd-border bg-fd-card px-4 py-3">
                      <span className="block text-xs uppercase tracking-[0.14em] text-fd-muted-foreground">
                        收录文档
                      </span>
                      <span className="block text-lg font-semibold text-fd-foreground">
                        {activeSection.articleCount}
                      </span>
                    </div>
                    <Link
                      href={activeSection.href}
                      className="inline-flex min-w-[168px] items-center justify-center gap-2 rounded-2xl border border-fd-border bg-fd-card px-4 py-3 text-sm font-semibold text-fd-foreground transition-colors hover:border-fd-muted-foreground hover:bg-fd-muted"
                    >
                      进入频道
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="my-5 h-px shrink-0 bg-[linear-gradient(90deg,transparent,var(--color-fd-border),transparent)]" />

            <div className="min-h-0 flex-1 overflow-y-auto pr-1 pt-2">
              {activeSection.articles.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {activeSection.articles.map((article) => (
                    <Link
                      key={article.href}
                      href={article.href}
                      className="group rounded-[24px] border border-fd-border bg-fd-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-fd-muted-foreground hover:shadow-[0_18px_40px_rgba(0,0,0,0.10)]"
                    >
                      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-fd-muted-foreground">
                        <span>{activeSection.title}</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>

                      <h3 className="mt-4 text-xl font-semibold leading-snug text-fd-foreground transition-colors group-hover:text-fd-primary">
                        {article.title}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-7 text-fd-popover-foreground">
                        {article.description}
                      </p>
                      <p className="mt-6 border-t border-fd-border pt-4 text-sm text-fd-muted-foreground">
                        {article.meta}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-fd-border bg-fd-card/60 px-6 py-10 text-center text-fd-muted-foreground">
                  当前专题还没有可展示的文档卡片。
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
