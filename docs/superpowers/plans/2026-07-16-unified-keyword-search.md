# Unified Keyword Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide working keyword search across `/docs` and `/blog` titles, descriptions, headings, and body text without Orama ID collisions.

**Architecture:** Build one cached array of Fumadocs advanced indexes from the generated docs loader and blog collection. Give every page a fixed-length SHA-256 ID, use Fumadocs/Orama for ranked full-text search, and merge it with a deterministic substring fallback for partial Chinese matches.

**Tech Stack:** Next.js 16 route handlers, TypeScript, Fumadocs 16 advanced search, Orama, Node.js test runner.

## Global Constraints

- Keep the existing Fumadocs search dialog and `/api/search` endpoint.
- Search both `/docs` and `/blog`.
- Search titles, descriptions or excerpts, headings, and body text.
- Support case-insensitive Latin keywords and partial Chinese text.
- Do not call `/api/chat`, an external model, or an external search service.
- Preserve canonical result URLs and anchors.
- Skip only records without a usable title or URL; surface index initialization failures.

## File Structure

- Create `src/lib/search-index.ts`: common index types, collision-safe IDs, docs/blog conversion, substring fallback, result merging, and cached unified indexes.
- Modify `src/app/api/search/route.ts`: create the ranked Fumadocs search server and expose a merged keyword-search GET handler.
- Replace `tests/search-source.test.mjs` with `tests/search-index.test.mjs`: regression and behavior tests for collision safety, titles, body text, Chinese substring matching, blog URLs, result merging, and empty queries.
- Delete `src/lib/search-source.ts`: URL deduplication does not address the actual child-ID collision.

---

### Task 1: Collision-Safe Advanced Indexes

**Files:**
- Create: `src/lib/search-index.ts`
- Create: `tests/search-index.test.mjs`
- Delete after replacement: `tests/search-source.test.mjs`
- Delete after replacement: `src/lib/search-source.ts`

**Interfaces:**
- Produces: `createSearchPageId(url: string): string`
- Produces: `toAdvancedIndex(page: SearchPage): Promise<AdvancedIndex>`
- `SearchPage` contains `url`, `title`, optional `description`, optional `breadcrumbs`, and a structured-data value or async loader.

- [ ] **Step 1: Write the failing collision regression test**

Create two pages whose URLs are `/docs/example` and `/docs/example-2`. Give the first page three headings so the historical URL-based ID strategy would create a child ID ending in `-2`.

```js
test('fixed-length page IDs do not collide with generated child IDs', async () => {
  const first = await toAdvancedIndex(page('/docs/example', 'Java guide', {
    headings: [heading('a'), heading('b'), heading('c')],
    contents: [],
  }));
  const second = await toAdvancedIndex(page('/docs/example-2', 'Java guide 2'));
  const search = createSearchAPI('advanced', {
    language: 'english',
    indexes: [first, second],
  });

  const results = await search.search('Java');

  assert.equal(results.some((result) => result.url === '/docs/example-2'), true);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/search-index.test.mjs`

Expected: FAIL because `src/lib/search-index.ts` or its exports do not exist.

- [ ] **Step 3: Implement stable IDs and page conversion**

Implement a fixed-length hash ID and resolve either eager or lazy structured data.

```ts
import { createHash } from 'node:crypto';
import type { AdvancedIndex } from 'fumadocs-core/search/server';
import type { StructuredData } from 'fumadocs-core/mdx-plugins';

export type SearchPage = {
  url: string;
  title: string;
  description?: string;
  breadcrumbs?: string[];
  structuredData: StructuredData | (() => Promise<StructuredData>);
};

export function createSearchPageId(url: string) {
  return createHash('sha256').update(url).digest('hex');
}

export async function toAdvancedIndex(page: SearchPage): Promise<AdvancedIndex> {
  const structuredData = typeof page.structuredData === 'function'
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
```

- [ ] **Step 4: Run the collision test and verify GREEN**

Run: `node --test tests/search-index.test.mjs`

Expected: PASS with the `/docs/example-2` result present and no `DOCUMENT_ALREADY_EXISTS` error.

---

### Task 2: Unified Docs and Blog Index Collection

**Files:**
- Modify: `src/lib/search-index.ts`
- Modify: `tests/search-index.test.mjs`

**Interfaces:**
- Produces: `buildUnifiedIndexes(docPages, blogPosts): Promise<AdvancedIndex[]>`
- Produces: `getUnifiedSearchIndexes(): Promise<AdvancedIndex[]>`
- Consumes docs pages from `source.getPages()` and blog entries from `collections/server`.

- [ ] **Step 1: Write failing docs/blog collection tests**

Use small real-shaped fixtures. Assert that docs keep `/docs/...` URLs, blog paths become `/blog/<slug>`, excerpts become descriptions, and lazy structured data is loaded.

```js
test('buildUnifiedIndexes includes docs and blog posts', async () => {
  const indexes = await buildUnifiedIndexes(
    [docPage('/docs/java', 'Java', 'JVM keyword')],
    [blogPost('wordpress-news.mdx', 'WordPress news', 'CMS excerpt', 'plugin keyword')],
  );

  assert.deepEqual(indexes.map((item) => item.url), ['/docs/java', '/blog/wordpress-news']);
  assert.equal(indexes[1].description, 'CMS excerpt');
  assert.equal(indexes[1].structuredData.contents[0].content, 'plugin keyword');
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/search-index.test.mjs`

Expected: FAIL because `buildUnifiedIndexes` is not implemented.

- [ ] **Step 3: Implement unified collection mapping and caching**

Map docs structured data from `page.data.structuredData` or `page.data.load()`. Map blogs from `post.info.path`, `post.title`, `post.excerpt ?? post.description`, and `(await post.load()).structuredData`. Filter unusable records before conversion.

```ts
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
      breadcrumbs: page.breadcrumbs,
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
```

Cache the production collection promise at module scope:

```ts
let unifiedIndexes: Promise<AdvancedIndex[]> | undefined;

export function getUnifiedSearchIndexes() {
  unifiedIndexes ??= buildUnifiedIndexes(source.getPages(), blog);
  return unifiedIndexes;
}
```

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test tests/search-index.test.mjs`

Expected: all collision and collection tests PASS.

---

### Task 3: Title, Keyword, and Chinese Substring Search

**Files:**
- Modify: `src/lib/search-index.ts`
- Modify: `tests/search-index.test.mjs`

**Interfaces:**
- Produces: `findSubstringMatches(indexes, query): SortedResult[]`
- Produces: `mergeSearchResults(primary, fallback, limit): SortedResult[]`
- Produces: `createKeywordSearch(indexes): { search(query, options): Promise<SortedResult[]> }`

- [ ] **Step 1: Write failing matching tests**

Add separate tests asserting:

```js
assert.equal((await keywordSearch.search('Java'))[0].type, 'page');
assert.equal((await keywordSearch.search('WordPress')).some((r) => r.url === '/docs/wordpress'), true);
assert.equal((await keywordSearch.search('多数据源')).some((r) => r.url === '/docs/data-source'), true);
assert.equal((await keywordSearch.search('body-only-keyword')).some((r) => r.type === 'text'), true);
assert.equal((await keywordSearch.search('blog-only-keyword')).some((r) => r.url.startsWith('/blog/')), true);
assert.deepEqual(await keywordSearch.search('   '), []);
```

Also assert that a match returned by both primary and fallback search appears only once after merging.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/search-index.test.mjs`

Expected: FAIL because substring matching and result merging are not implemented.

- [ ] **Step 3: Implement normalized substring fallback**

Normalize with `trim().toLocaleLowerCase()`. Walk title, description, headings, and contents. Create standard Fumadocs `SortedResult` objects, preserving heading anchors and assigning type priority `page = 0`, `heading = 1`, `text = 2`.

```ts
function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function findSubstringMatches(indexes: readonly AdvancedIndex[], query: string) {
  const needle = normalize(query);
  if (!needle) return [];
  const results: SortedResult[] = [];

  for (const page of indexes) {
    if (normalize(page.title).includes(needle)) {
      results.push({ id: `${page.id}:title`, type: 'page', url: page.url, content: page.title });
    }
    if (page.description && normalize(page.description).includes(needle)) {
      results.push({
        id: `${page.id}:description`,
        type: 'text',
        url: page.url,
        content: page.description,
      });
    }
    page.structuredData.headings.forEach((heading, index) => {
      if (!normalize(heading.content).includes(needle)) return;
      results.push({
        id: `${page.id}:heading:${index}`,
        type: 'heading',
        url: `${page.url}#${heading.id}`,
        content: heading.content,
      });
    });
    page.structuredData.contents.forEach((content, index) => {
      if (!normalize(content.content).includes(needle)) return;
      results.push({
        id: `${page.id}:content:${index}`,
        type: 'text',
        url: content.heading ? `${page.url}#${content.heading}` : page.url,
        content: content.content,
      });
    });
  }

  return results;
}
```

- [ ] **Step 4: Implement ranked merge and keyword search wrapper**

Create one Fumadocs advanced server with `language: 'english'`. Search it first, merge with fallback results by normalized `type + url + content`, sort page results before heading and text results, and enforce `options.limit ?? 20`.

```ts
export function createKeywordSearch(indexes: readonly AdvancedIndex[]) {
  const primary = createSearchAPI('advanced', { language: 'english', indexes: [...indexes] });
  return {
    async search(query: string, options: QueryOptions = {}) {
      if (!query.trim()) return [];
      const primaryResults = await primary.search(query, options);
      const fallbackResults = findSubstringMatches(indexes, query);
      return mergeSearchResults(primaryResults, fallbackResults, options.limit ?? 20);
    },
  };
}
```

- [ ] **Step 5: Run tests and verify GREEN**

Run: `node --test tests/search-index.test.mjs`

Expected: every title, keyword, Chinese substring, blog, merge, and empty-query test PASS.

---

### Task 4: Route Wiring and End-to-End Verification

**Files:**
- Modify: `src/app/api/search/route.ts`
- Modify: `tests/search-index.test.mjs`
- Delete: `src/lib/search-source.ts`
- Delete: `tests/search-source.test.mjs`

**Interfaces:**
- Consumes: `getUnifiedSearchIndexes()` and `createKeywordSearch()`.
- Produces: `GET(request: Request): Promise<Response>` for `/api/search`.

- [ ] **Step 1: Write a failing route-handler test around an injected search fixture**

Extract `createSearchHandler(getIndexes)` so the test can call a real `Request` without loading the full MDX collection.

```js
test('search handler returns standard JSON results', async () => {
  const GET = createSearchHandler(async () => fixtureIndexes);
  const response = await GET(new Request('http://localhost/api/search?query=Java'));
  const results = await response.json();

  assert.equal(response.status, 200);
  assert.equal(results.some((result) => result.url === '/docs/java'), true);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/search-index.test.mjs`

Expected: FAIL because `createSearchHandler` is not implemented.

- [ ] **Step 3: Implement the route handler and production wiring**

```ts
export function createSearchHandler(getIndexes: () => Promise<AdvancedIndex[]>) {
  let search: Promise<ReturnType<typeof createKeywordSearch>> | undefined;
  return async function GET(request: Request) {
    const url = new URL(request.url);
    const query = url.searchParams.get('query')?.trim();
    if (!query) return Response.json([]);
    const limitValue = Number(url.searchParams.get('limit'));
    const limit = Number.isInteger(limitValue) && limitValue > 0 ? limitValue : undefined;
    search ??= getIndexes().then(createKeywordSearch);
    return Response.json(await (await search).search(query, { limit }));
  };
}

export const GET = createSearchHandler(getUnifiedSearchIndexes);
```

- [ ] **Step 4: Run the complete automated verification**

Run: `node --test tests/search-index.test.mjs`

Expected: all tests PASS with zero failures.

Run: `pnpm.cmd types:check`

Expected: generated Fumadocs and Next route types complete and TypeScript exits 0.

Run: `git diff --check`

Expected: exits 0 with no whitespace errors.

- [ ] **Step 5: Restart development server and verify live search**

Restart the existing `next dev` process so its cached rejected search promise is cleared, then request:

```text
GET /api/search?query=Java
GET /api/search?query=WordPress
GET /api/search?query=多数据源
```

Expected: all return HTTP 200 JSON arrays; Java and Chinese results contain `/docs/...` URLs, and a known blog keyword returns a `/blog/...` URL. The server log contains no `DOCUMENT_ALREADY_EXISTS` error.
