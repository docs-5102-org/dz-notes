import assert from 'node:assert/strict';
import test from 'node:test';
import { createKeywordSearch, createSearchHandler, toAdvancedIndex } from '../src/lib/search-index.ts';

const snapshotModule = await import('../src/lib/search-snapshot.ts');

async function fixture() {
  return Promise.all([
    toAdvancedIndex({
      url: '/docs/java',
      title: 'Java development guide',
      description: 'JVM configuration',
      structuredData: {
        headings: [{ id: 'connection-pool', content: 'Connection pool' }],
        contents: [{ heading: 'connection-pool', content: 'database-body-keyword connection tuning' }],
      },
    }),
    toAdvancedIndex({
      url: '/docs/data-source',
      title: 'Spring Boot 多数据源配置教程',
      structuredData: { headings: [], contents: [] },
    }),
    toAdvancedIndex({
      url: '/blog/release',
      title: 'WordPress release notes',
      structuredData: {
        headings: [],
        contents: [{ content: 'blog-only-keyword 插件安装方法' }],
      },
    }),
  ]);
}

test('serialized search snapshot preserves ranking, highlights, Chinese matches and anchors', async () => {
  assert.equal(typeof snapshotModule.buildSearchSnapshot, 'function', 'snapshot builder is missing');
  assert.equal(typeof snapshotModule.restoreSearchSnapshot, 'function', 'snapshot restoration is missing');
  const indexes = await fixture();
  const reference = createKeywordSearch(indexes);
  const snapshot = JSON.parse(JSON.stringify(await snapshotModule.buildSearchSnapshot(indexes)));
  const restored = snapshotModule.restoreSearchSnapshot(snapshot);

  for (const query of ['Java', 'JVM', 'connection', 'database-body-keyword', '多数据源', 'WordPress', 'blog-only-keyword', '插件安装', 'no-such-keyword', '   ']) {
    // Compare the public JSON contract: serialization omits undefined fields.
    assert.deepEqual(
      JSON.parse(JSON.stringify(await restored.search(query))),
      JSON.parse(JSON.stringify(await reference.search(query))),
      query,
    );
  }
  assert.equal((await restored.search('Java'))[0].content, '<mark>Java</mark> development guide');
  assert.equal((await restored.search('database-body-keyword')).some((result) => result.url === '/docs/java#connection-pool'), true);
  assert.equal((await restored.search('插件安装')).some((result) => result.url === '/blog/release'), true);
  assert.equal((await restored.search('connection', { limit: 1 })).length, 1);
});

test('snapshot restoration rejects an incompatible format', () => {
  assert.equal(typeof snapshotModule.restoreSearchSnapshot, 'function', 'snapshot restoration is missing');
  assert.throws(() => snapshotModule.restoreSearchSnapshot({ version: 999 }), /version|format/i);
});

test('search handler retries initialization after a failure and shares concurrent initialization', async () => {
  const indexes = await fixture();
  let attempts = 0;
  const GET = createSearchHandler(async () => {
    attempts++;
    if (attempts === 1) throw new Error('temporary load failure');
    return createKeywordSearch(indexes);
  });
  const request = () => new Request('http://localhost/api/search?query=Java');

  await assert.rejects(GET(request()), /temporary load failure/);
  const responses = await Promise.all([GET(request()), GET(request())]);
  for (const response of responses) {
    assert.equal(response.status, 200);
    assert.equal((await response.json())[0].url, '/docs/java');
  }
  assert.equal(attempts, 2);
});

test('empty queries do not load the search snapshot', async () => {
  const GET = createSearchHandler(async () => { throw new Error('must not initialize'); });
  const response = await GET(new Request('http://localhost/api/search?query=%20%20'));
  assert.deepEqual(await response.json(), []);
});
