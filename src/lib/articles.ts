import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import { getDocChannels } from '@/lib/doc-channels';

type SourcePage = {
  url: string;
  slugs: string[];
  data: {
    title: string;
    subTitle?: string;
    description?: string;
    date?: string | Date;
    tags?: string[];
    tag?: string[] | string;
  };
};

export type ArticleSummary = {
  title: string;
  description: string;
  href: string;
  channelSlug: string;
  channelTitle: string;
  dateLabel: string;
  timestamp: number;
  tags: string[];
  image: string;
  readingMinutes: number;
  views: number;
};

export type ChannelSummary = ReturnType<typeof buildChannelSummary>;

function getDisplayTitle(page: SourcePage) {
  return page.data.subTitle?.trim() || page.data.title;
}

function getDisplayDescription(page: SourcePage) {
  return page.data.description?.trim() || '沉淀主题文档、实践记录与可复用的知识索引。';
}

function getPageTags(page: SourcePage) {
  const data = page.data as unknown as Record<string, unknown>;
  const values = [data.tags, data.tag];
  const tags = values
    .flatMap((value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return value.split(',');
      return [];
    })
    .filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
    .map((tag) => tag.trim());

  return Array.from(new Set(tags));
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

function getArticleImage(page: SourcePage) {
  return `https://picsum.photos/seed/article-${page.slugs.join('-')}/1200/720`;
}

function getFrontmatter(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  if (!match) return {};

  const data = load(match[1]);
  return data && typeof data === 'object' ? data as Record<string, unknown> : {};
}

function getSlugFromFile(filePath: string) {
  const relative = path.relative(path.join(process.cwd(), 'content', 'docs'), filePath);
  const parsed = path.parse(relative);
  const parts = parsed.dir.split(path.sep).filter(Boolean);

  if (parsed.name !== 'index') {
    parts.push(parsed.name);
  }

  return parts;
}

function getDocPages(): SourcePage[] {
  const docsDir = path.join(process.cwd(), 'content', 'docs');
  const files: string[] = [];
  const stack = [docsDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith('.mdx')) {
        files.push(entryPath);
      }
    }
  }

  return files.map((filePath) => {
    const slugs = getSlugFromFile(filePath);
    const frontmatter = getFrontmatter(filePath);
    const title = typeof frontmatter.title === 'string' ? frontmatter.title : slugs.at(-1) ?? '';
    const subTitle = typeof frontmatter.subTitle === 'string' ? frontmatter.subTitle : undefined;
    const description =
      typeof frontmatter.description === 'string' ? frontmatter.description : undefined;

    return {
      url: `/docs/${slugs.map(encodeURIComponent).join('/')}`,
      slugs,
      data: {
        title,
        subTitle,
        description,
        date: frontmatter.date as SourcePage['data']['date'],
        tags: Array.isArray(frontmatter.tags)
          ? frontmatter.tags.filter((tag): tag is string => typeof tag === 'string')
          : undefined,
        tag:
          Array.isArray(frontmatter.tag) || typeof frontmatter.tag === 'string'
            ? frontmatter.tag as SourcePage['data']['tag']
            : undefined,
      },
    };
  });
}

function getStableNumber(input: string, min: number, max: number) {
  const range = max - min + 1;
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return min + (hash % range);
}

function getReadingMinutes(title: string, description: string) {
  const words = `${title} ${description}`.trim().length;
  return Math.max(1, Math.ceil(words / 360));
}

function buildArticleSummary(
  page: SourcePage,
  channelMap: Map<string, ReturnType<typeof getDocChannels>[number]>,
): ArticleSummary | null {
  if (page.slugs.length < 2) return null;

  const channel = channelMap.get(page.slugs[0]);
  if (!channel) return null;

  const title = getDisplayTitle(page);
  const description = getDisplayDescription(page);

  return {
    title,
    description,
    href: page.url,
    channelSlug: channel.slug,
    channelTitle: channel.title,
    dateLabel: getDateLabel(page),
    timestamp: getPageTimestamp(page),
    tags: getPageTags(page),
    image: getArticleImage(page),
    readingMinutes: getReadingMinutes(title, description),
    views: getStableNumber(page.url, 120, 9800),
  };
}

export function buildTagStats(items: string[]) {
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
    backgroundImage: `https://picsum.photos/seed/home-${channel.slug}/1200/720`,
  };
}

export function getArticleData() {
  const docChannels = getDocChannels();
  const channelMap = new Map(docChannels.map((channel) => [channel.slug, channel]));

  const articles = getDocPages()
    .map((page) => buildArticleSummary(page, channelMap))
    .filter((page): page is ArticleSummary => page !== null)
    .sort((a, b) => {
      if (a.timestamp !== b.timestamp) return b.timestamp - a.timestamp;
      return a.href.localeCompare(b.href);
    });

  const channelSummaries = docChannels
    .map((channel) =>
      buildChannelSummary(
        channel,
        articles.filter((article) => article.channelSlug === channel.slug),
      ),
    )
    .filter((channel) => channel.articleCount > 0);

  return {
    articles,
    channelSummaries,
    channelMap,
    tagStats: buildTagStats(articles.flatMap((article) => article.tags)),
  };
}

export function getArticleBadgeClass(article: Pick<ArticleSummary, 'channelSlug'>) {
  switch (article.channelSlug) {
    case 'devops':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200';
    case 'web':
      return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200';
    default:
      return 'border-fd-border bg-fd-secondary text-fd-muted-foreground';
  }
}
