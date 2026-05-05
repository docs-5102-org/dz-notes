import type { Metadata } from 'next';
import { DocsTopicsShowcase, type DocsTopicSection } from '@/components/docs/docs-topics-showcase';
import { getDocChannels } from '@/lib/doc-channels';
import { source } from '@/lib/source';

export const metadata: Metadata = {
  title: '专题广场',
  description: '按频道组织的文档专题与内容入口。',
};

type Props = {
  searchParams?: Promise<{
    preview?: string;
  }>;
};

// 文章卡片优先使用 `subTitle` 作为展示标题，便于索引页提供更清晰的列表名称。
function getArticleDisplayTitle(
  page: ReturnType<typeof source.getPages>[number] | undefined,
) {
  if (!page) return '';
  return page.data.subTitle ?? page.data.title;
}

// 按二级 slug 对频道页面分组，并为每个二级目录或二级页面生成一张展示卡片。
function buildChannelArticles(
  channel: ReturnType<typeof getDocChannels>[number],
  pages: ReturnType<typeof source.getPages>,
): DocsTopicSection['articles'] {
  const channelPages = pages.filter((page) => page.slugs[0] === channel.slug);
  const entries = new Map<string, DocsTopicSection['articles'][number]>();
  const groupedChildren = new Map<string, typeof channelPages>();

  for (const page of channelPages) {
    if (page.url === channel.href) continue;

    const secondSlug = page.slugs[1];
    if (!secondSlug) continue;

    if (page.slugs.length === 2) {
      entries.set(secondSlug, {
        title: getArticleDisplayTitle(page),
        description: page.data.description ?? '继续完善这篇文档的内容结构与示例。',
        href: page.url,
        meta: `${channel.title} / ${decodeURI(secondSlug)}`,
      });
      continue;
    }

    const siblings = groupedChildren.get(secondSlug) ?? [];
    siblings.push(page);
    groupedChildren.set(secondSlug, siblings);
  }

  for (const [secondSlug, children] of groupedChildren) {
    if (entries.has(secondSlug)) continue;

    const overviewPage = source.getPage([channel.slug, secondSlug]);
    const representative = overviewPage ?? children[0];

    entries.set(secondSlug, {
      title: getArticleDisplayTitle(representative) || decodeURI(secondSlug),
      description:
        representative?.data.description ??
        `查看 ${decodeURI(secondSlug)} 分类下的 ${children.length} 篇文档。`,
      href: representative?.url ?? children[0].url,
      meta: `${channel.title} / ${decodeURI(secondSlug)} / ${children.length} 篇文档`,
    });
  }

  return Array.from(entries.values()).sort((a, b) => a.href.localeCompare(b.href));
}

export default async function DocsHomePage({ searchParams }: Props) {
  const params = await searchParams;
  const enableDemoChannels = params?.preview === 'channels';
  const pages = source.getPages();
  const docChannels = getDocChannels();

  const sections: DocsTopicSection[] = docChannels.map((channel) => {
    const overviewPage = source.getPage([channel.slug]);
    const articles = buildChannelArticles(channel, pages);

    return {
      id: channel.slug,
      title: channel.title,
      description: overviewPage?.data.description ?? channel.description,
      href: channel.href,
      color: channel.color,
      meta: channel.meta,
      backgroundImage: `https://picsum.photos/seed/${channel.slug}-topic/1200/720`,
      articleCount: articles.length,
      articles,
    };
  });

  const demoChannels = [
    { id: 'java', title: 'Java', tone: 'var(--channel-coding)', base: 'coding' },
    { id: 'ai', title: 'AI 应用', tone: 'var(--channel-web)', base: 'web' },
    { id: 'workflow', title: '效率工作流', tone: 'var(--channel-notion)', base: 'notion' },
    { id: 'prompt', title: 'Prompt Engineering', tone: 'var(--channel-web)', base: 'web' },
    { id: 'system', title: '系统设计', tone: 'var(--channel-coding)', base: 'coding' },
    { id: 'tooling', title: '前端工程化', tone: 'var(--channel-web)', base: 'web' },
    { id: 'notes', title: '知识管理', tone: 'var(--channel-notion)', base: 'notion' },
    { id: 'career', title: '开发者成长', tone: 'var(--channel-coding)', base: 'coding' },
    { id: 'productivity', title: '个人效率', tone: 'var(--channel-notion)', base: 'notion' },
    { id: 'oss', title: '开源实践', tone: 'var(--channel-web)', base: 'web' },
  ] as const;

  const demoSections: DocsTopicSection[] = demoChannels.map((demo, index) => {
    const baseSection = sections.find((section) => section.id === demo.base) ?? sections[0];
    const articles = (baseSection?.articles ?? []).map((article, articleIndex) => ({
      ...article,
      meta: `示例频道 / ${demo.title} / ${articleIndex + 1}`,
    }));

    return {
      id: `demo-${demo.id}`,
      title: demo.title,
      description:
        '这是用于预览专题广场导航密度的示例频道。它复用了现有文档卡片结构，用来模拟频道数量增加到 10 个以上时的展示效果。',
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
