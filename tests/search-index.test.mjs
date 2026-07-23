import assert from 'node:assert/strict';
import test from 'node:test';
import { createSearchAPI } from 'fumadocs-core/search/server';
import {
  buildUnifiedIndexes,
  createKeywordSearch,
  createSearchHandler,
  mergeSearchResults,
  toAdvancedIndex,
} from '../src/lib/search-index.ts';

const emptyStructuredData = { headings: [], contents: [] };

function heading(content) {
  return { id: content.toLowerCase(), content };
}

function page(url, title, structuredData = emptyStructuredData) {
  return { url, title, structuredData };
}

test('fixed-length page IDs do not collide with generated child IDs', async () => {
  const first = await toAdvancedIndex(
    page('/docs/example', 'Java guide', {
      headings: [heading('A'), heading('B'), heading('C')],
      contents: [],
    }),
  );
  const second = await toAdvancedIndex(page('/docs/example-2', 'Java guide 2'));
  const search = createSearchAPI('advanced', {
    language: 'english',
    indexes: [first, second],
  });

  const results = await search.search('Java');

  assert.equal(results.some((result) => result.url === '/docs/example-2'), true);
});

test('buildUnifiedIndexes includes docs and blog posts', async () => {
  const indexes = await buildUnifiedIndexes(
    [
      {
        url: '/docs/java',
        data: {
          title: 'Java',
          description: 'JVM keyword',
          structuredData: emptyStructuredData,
        },
      },
    ],
    [
      {
        info: { path: 'wordpress-news.mdx' },
        title: 'WordPress news',
        description: 'CMS description',
        excerpt: 'CMS excerpt',
        load: async () => ({
          structuredData: {
            headings: [],
            contents: [{ heading: undefined, content: 'plugin keyword' }],
          },
        }),
      },
    ],
  );

  assert.deepEqual(
    indexes.map((item) => item.url),
    ['/docs/java', '/blog/wordpress-news'],
  );
  assert.equal(indexes[1].description, 'CMS excerpt');
  assert.equal(indexes[1].structuredData.contents[0].content, 'plugin keyword');
});

async function createKeywordFixture() {
  return Promise.all([
    toAdvancedIndex(
      page('/docs/java', 'Java development guide', {
        headings: [],
        contents: [
          { heading: undefined, content: 'body-only-keyword appears here' },
        ],
      }),
    ),
    toAdvancedIndex(page('/docs/wordpress', 'WordPress site guide')),
    toAdvancedIndex(page('/docs/data-source', 'Spring Boot 多数据源配置教程')),
    toAdvancedIndex(
      page('/blog/release-notes', 'Release notes', {
        headings: [],
        contents: [
          { heading: undefined, content: 'blog-only-keyword appears here' },
        ],
      }),
    ),
  ]);
}

test('keyword search returns a title match as a page result', async () => {
  const search = createKeywordSearch(await createKeywordFixture());

  const results = await search.search('Java');

  assert.equal(results[0].type, 'page');
  assert.equal(results[0].url, '/docs/java');
});

test('keyword search finds WordPress document titles', async () => {
  const search = createKeywordSearch(await createKeywordFixture());

  const results = await search.search('WordPress');

  assert.equal(results.some((result) => result.url === '/docs/wordpress'), true);
});

test('keyword search finds partial Chinese titles', async () => {
  const search = createKeywordSearch(await createKeywordFixture());

  const results = await search.search('多数据源');

  assert.equal(results.some((result) => result.url === '/docs/data-source'), true);
});

test('keyword search finds body-only keywords', async () => {
  const search = createKeywordSearch(await createKeywordFixture());

  const results = await search.search('body-only-keyword');

  assert.equal(results.some((result) => result.type === 'text'), true);
});

test('keyword search returns blog body matches with blog URLs', async () => {
  const search = createKeywordSearch(await createKeywordFixture());

  const results = await search.search('blog-only-keyword');

  assert.equal(results.some((result) => result.url === '/blog/release-notes'), true);
});

test('keyword search returns no results for whitespace-only queries', async () => {
  const search = createKeywordSearch(await createKeywordFixture());

  assert.deepEqual(await search.search('   '), []);
});

test('mergeSearchResults removes highlighted duplicates', () => {
  const results = mergeSearchResults(
    [
      {
        id: 'primary',
        type: 'page',
        url: '/docs/java',
        content: '<mark>Java</mark> development guide',
      },
    ],
    [
      {
        id: 'fallback',
        type: 'page',
        url: '/docs/java',
        content: 'Java development guide',
      },
    ],
    20,
  );

  assert.equal(results.length, 1);
});

test('search handler returns standard JSON results', async () => {
  const indexes = await createKeywordFixture();
  const GET = createSearchHandler(async () => indexes);

  const response = await GET(
    new Request('http://localhost/api/search?query=Java'),
  );
  const results = await response.json();

  assert.equal(response.status, 200);
  assert.equal(results.some((result) => result.url === '/docs/java'), true);
});
