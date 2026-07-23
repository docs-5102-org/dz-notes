import { createHash } from 'node:crypto';
import type { StructuredData } from 'fumadocs-core/mdx-plugins';
import type { SortedResult } from 'fumadocs-core/search';
import {
  createSearchAPI,
  type AdvancedIndex,
  type QueryOptions,
} from 'fumadocs-core/search/server';

export type SearchPage = {
  url: string;
  title: string;
  description?: string;
  breadcrumbs?: string[];
  structuredData: StructuredData | (() => Promise<StructuredData>);
};

export type DocSearchInput = {
  url: string;
  data: {
    title?: string;
    description?: string;
    structuredData?: StructuredData | (() => Promise<StructuredData>);
    load?: () => Promise<{ structuredData: StructuredData }>;
  };
};

export type BlogSearchInput = {
  info: { path: string };
  title?: string;
  description?: string;
  excerpt?: string;
  load: () => Promise<{ structuredData: StructuredData }>;
};

export function createSearchPageId(url: string) {
  return createHash('sha256').update(url).digest('hex');
}

export async function toAdvancedIndex(page: SearchPage): Promise<AdvancedIndex> {
  const structuredData =
    typeof page.structuredData === 'function'
      ? await page.structuredData()
      : page.structuredData;

  return {
    id: createSearchPageId(page.url),
    title: page.title,
    description: page.description,
    breadcrumbs: page.breadcrumbs,
    structuredData,
    url: page.url,
  };
}

async function resolveDocStructuredData(page: DocSearchInput) {
  const { data } = page;

  if (data.structuredData) {
    return typeof data.structuredData === 'function'
      ? data.structuredData()
      : data.structuredData;
  }

  if (data.load) return (await data.load()).structuredData;

  throw new Error(`Cannot find structured data for search page: ${page.url}`);
}

export async function buildUnifiedIndexes(
  docPages: readonly DocSearchInput[],
  blogPosts: readonly BlogSearchInput[],
) {
  const pages: SearchPage[] = [];

  for (const page of docPages) {
    if (!page.url || !page.data.title) continue;

    pages.push({
      url: page.url,
      title: page.data.title,
      description: page.data.description,
      structuredData: () => resolveDocStructuredData(page),
    });
  }

  for (const post of blogPosts) {
    const slug = post.info.path.replace(/\.mdx?$/, '');
    if (!slug || !post.title) continue;

    pages.push({
      url: `/blog/${slug}`,
      title: post.title,
      description: post.excerpt ?? post.description,
      structuredData: async () => (await post.load()).structuredData,
    });
  }

  return Promise.all(pages.map(toAdvancedIndex));
}

let unifiedIndexes: Promise<AdvancedIndex[]> | undefined;

export function getUnifiedSearchIndexes() {
  unifiedIndexes ??= Promise.all([
    import('@/lib/source'),
    import('collections/server'),
  ]).then(([{ source }, { blog }]) => buildUnifiedIndexes(source.getPages(), blog));

  return unifiedIndexes;
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function findSubstringMatches(
  indexes: readonly AdvancedIndex[],
  query: string,
) {
  const needle = normalize(query);
  if (!needle) return [];

  const results: SortedResult[] = [];

  for (const page of indexes) {
    if (normalize(page.title).includes(needle)) {
      results.push({
        id: `${page.id}:title`,
        type: 'page',
        url: page.url,
        content: page.title,
        breadcrumbs: page.breadcrumbs,
      });
    }

    if (page.description && normalize(page.description).includes(needle)) {
      results.push({
        id: `${page.id}:description`,
        type: 'text',
        url: page.url,
        content: page.description,
        breadcrumbs: page.breadcrumbs,
      });
    }

    page.structuredData.headings.forEach((heading, index) => {
      if (!normalize(heading.content).includes(needle)) return;

      results.push({
        id: `${page.id}:heading:${index}`,
        type: 'heading',
        url: `${page.url}#${heading.id}`,
        content: heading.content,
        breadcrumbs: page.breadcrumbs,
      });
    });

    page.structuredData.contents.forEach((content, index) => {
      if (!normalize(content.content).includes(needle)) return;

      results.push({
        id: `${page.id}:content:${index}`,
        type: 'text',
        url: content.heading ? `${page.url}#${content.heading}` : page.url,
        content: content.content,
        breadcrumbs: page.breadcrumbs,
      });
    });
  }

  return results;
}

const resultTypePriority: Record<SortedResult['type'], number> = {
  page: 0,
  heading: 1,
  text: 2,
};

function getResultIdentity(result: SortedResult) {
  const content = result.content.replace(/<\/?mark>/g, '');
  return `${result.type}\u0000${result.url}\u0000${normalize(content)}`;
}

export function mergeSearchResults(
  primary: readonly SortedResult[],
  fallback: readonly SortedResult[],
  limit: number,
) {
  const seen = new Set<string>();

  return [...primary, ...fallback]
    .sort((left, right) => resultTypePriority[left.type] - resultTypePriority[right.type])
    .filter((result) => {
      const identity = getResultIdentity(result);
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    })
    .slice(0, limit);
}

export function createKeywordSearch(indexes: readonly AdvancedIndex[]) {
  const primary = createSearchAPI('advanced', {
    language: 'english',
    indexes: [...indexes],
  });

  return {
    async search(query: string, options: QueryOptions = {}) {
      if (!query.trim()) return [];

      const primaryResults = await primary.search(query, options);
      const fallbackResults = findSubstringMatches(indexes, query);

      return mergeSearchResults(primaryResults, fallbackResults, options.limit ?? 20);
    },
  };
}

export function createSearchHandler(
  getIndexes: () => Promise<AdvancedIndex[]>,
) {
  let search: Promise<ReturnType<typeof createKeywordSearch>> | undefined;

  return async function GET(request: Request) {
    const url = new URL(request.url);
    const query = url.searchParams.get('query')?.trim();

    if (!query) return Response.json([]);

    const limitValue = Number(url.searchParams.get('limit'));
    const limit =
      Number.isInteger(limitValue) && limitValue > 0 ? limitValue : undefined;

    search ??= getIndexes().then(createKeywordSearch);

    return Response.json(await (await search).search(query, { limit }));
  };
}
