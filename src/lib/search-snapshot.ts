import { create, getByID, load, search, type RawData, type TypedDocument, type Orama } from '@orama/orama';
import { createContentHighlighter, type SortedResult } from 'fumadocs-core/search';
import { createSearchAPI, type AdvancedIndex, type QueryOptions } from 'fumadocs-core/search/server';
import {
  buildSubstringRecords,
  mergeSearchResults,
  searchSubstringRecords,
  type KeywordSearch,
  type SubstringRecord,
} from './search-index.ts';

// Match Fumadocs 16's advanced schema and grouped search result adapter.
const schema = {
  content: 'string',
  page_id: 'string',
  type: 'string',
  breadcrumbs: 'string[]',
  tags: 'enum[]',
  url: 'string',
  embeddings: 'vector[512]',
} as const;
type SearchDocument = TypedDocument<Orama<typeof schema>>;

export type SearchSnapshot = {
  version: 1;
  database: RawData;
  fallback: SubstringRecord[];
};

export async function buildSearchSnapshot(indexes: readonly AdvancedIndex[]): Promise<SearchSnapshot> {
  const primary = createSearchAPI('advanced', {
    language: 'english',
    indexes: [...indexes],
  });

  return {
    version: 1,
    database: await primary.export() as RawData,
    fallback: buildSubstringRecords(indexes),
  };
}

export function restoreSearchSnapshot(snapshot: SearchSnapshot): KeywordSearch {
  if (snapshot.version !== 1 || !snapshot.database || !Array.isArray(snapshot.fallback)) {
    throw new Error('Unsupported search snapshot version or format. Run pnpm search:build.');
  }

  const db = create({ schema, language: 'english' });
  load(db, snapshot.database);

  return {
    async search(query: string, options: QueryOptions = {}) {
      if (!query.trim()) return [];

      const tags = typeof options.tag === 'string' ? [options.tag] : options.tag ?? [];
      const response = await search<typeof db, SearchDocument>(db, {
        term: query,
        mode: 'fulltext',
        properties: ['content'],
        // Fumadocs' existing adapter passes undefined when no limit is supplied.
        limit: options.limit,
        where: tags.length > 0 ? { tags: { containsAll: tags } } : {},
        groupBy: { properties: ['page_id'], maxResult: 8 },
      });
      const highlighter = createContentHighlighter(query);
      const primary: SortedResult[] = [];

      for (const group of response.groups ?? []) {
        const pageId = String(group.values[0]);
        const page = getByID(db, pageId);
        if (!page) continue;

        primary.push({
          id: pageId,
          type: 'page',
          content: highlighter.highlightMarkdown(page.content),
          breadcrumbs: page.breadcrumbs,
          url: page.url,
        });
        for (const hit of group.result) {
          if (hit.document.type === 'page') continue;
          primary.push({
            id: String(hit.document.id),
            type: hit.document.type as SortedResult['type'],
            content: highlighter.highlightMarkdown(hit.document.content),
            breadcrumbs: hit.document.breadcrumbs,
            url: hit.document.url,
          });
        }
      }

      const limitedPrimary = options.limit === undefined ? primary : primary.slice(0, options.limit);
      return mergeSearchResults(
        limitedPrimary,
        searchSubstringRecords(snapshot.fallback, query),
        options.limit ?? 20,
      );
    },
  };
}
