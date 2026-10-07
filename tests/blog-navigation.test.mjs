import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import yaml from 'js-yaml';
import * as navigation from '../src/lib/blog-navigation.ts';
import {
  filterBlogPosts,
  getAdjacentBlogPosts,
  getBlogCategories,
} from '../src/lib/blog-navigation.ts';

const posts = Object.freeze([
  Object.freeze({ slug: 'newest', category: 'AI, codex', title: '最新文章' }),
  Object.freeze({ slug: 'middle', category: '随笔', title: '中间文章' }),
  Object.freeze({ slug: 'oldest', category: '随笔', title: '最早文章' }),
]);

test('blog categories count real frontmatter values without splitting comma categories', () => {
  const categories = getBlogCategories(posts);
  assert.equal(categories.length, 2);
  assert.deepEqual(categories.find((c) => c.name === '随笔'), { name: '随笔', count: 2 });
  assert.deepEqual(categories.find((c) => c.name === 'AI, codex'), { name: 'AI, codex', count: 1 });
  assert.deepEqual(getBlogCategories([]), []);
});

test('blog filter preserves source order and article identity, and permits all or empty results', () => {
  assert.deepEqual(filterBlogPosts(posts), posts);
  assert.deepEqual(filterBlogPosts(posts, ''), posts);
  assert.deepEqual(filterBlogPosts(posts, '随笔'), [posts[1], posts[2]]);
  assert.deepEqual(filterBlogPosts(posts, 'AI, codex'), [posts[0]]);
  assert.deepEqual(filterBlogPosts(posts, 'AI'), []);
  assert.deepEqual(filterBlogPosts([], '随笔'), []);
  assert.equal(filterBlogPosts(posts, '随笔')[0], posts[1]);
});

test('blog adjacent links follow the existing newest-first order and stop at boundaries', () => {
  assert.deepEqual(getAdjacentBlogPosts(posts, 'middle'), { previous: posts[0], next: posts[2] });
  assert.deepEqual(getAdjacentBlogPosts(posts, 'newest'), { previous: undefined, next: posts[1] });
  assert.deepEqual(getAdjacentBlogPosts(posts, 'oldest'), { previous: posts[1], next: undefined });
  assert.deepEqual(getAdjacentBlogPosts(posts, 'unknown'), { previous: undefined, next: undefined });
  assert.deepEqual(getAdjacentBlogPosts([posts[0]], 'newest'), { previous: undefined, next: undefined });
  assert.deepEqual(getAdjacentBlogPosts([], 'unknown'), { previous: undefined, next: undefined });
});

function paginate(source, query = {}) {
  assert.equal(typeof navigation.getBlogPagination, 'function', 'blog pagination helper is missing');
  return navigation.getBlogPagination(source, query);
}

function listHref(category, page) {
  assert.equal(typeof navigation.getBlogListHref, 'function', 'blog list URL helper is missing');
  return navigation.getBlogListHref(category, page);
}

const orderedPosts = Object.freeze(Array.from({ length: 53 }, (_, index) => Object.freeze({
  slug: `post-${index + 1}`,
  category: index % 2 === 0 ? '随笔' : 'AI, codex',
})));

test('ten-post pages cover 0, 1, 10, 11, 20 and 53 posts with correct ranges', () => {
  for (const total of [0, 1, 10, 11, 20, 53]) {
    const source = orderedPosts.slice(0, total);
    const expectedPageCount = Math.max(1, Math.ceil(total / 10));
    for (let page = 1; page <= expectedPageCount; page++) {
      const result = paginate(source, { page: String(page) });
      assert.equal(result.totalPosts, total);
      assert.equal(result.pageCount, expectedPageCount);
      assert.equal(result.page, page);
      assert.equal(result.start, total === 0 ? 0 : (page - 1) * 10 + 1);
      assert.equal(result.end, Math.min(page * 10, total));
      assert.deepEqual(result.posts, source.slice((page - 1) * 10, page * 10));
    }
  }
});

test('all six pages retain newest-first order and every original article exactly once', () => {
  const pages = Array.from({ length: 6 }, (_, index) => paginate(orderedPosts, { page: String(index + 1) }));
  assert.deepEqual(pages.map((page) => page.posts.length), [10, 10, 10, 10, 10, 3]);
  const combined = pages.flatMap((page) => page.posts);
  assert.deepEqual(combined, orderedPosts);
  assert.equal(new Set(combined.map((post) => post.slug)).size, 53);
  combined.forEach((post, index) => assert.equal(post, orderedPosts[index]));
});

test('category filtering happens before slicing and full category counts remain available', () => {
  const categoryPosts = orderedPosts.filter((post) => post.category === 'AI, codex');
  const result = paginate(orderedPosts, { category: 'AI, codex', page: '2' });
  assert.equal(result.category, 'AI, codex');
  assert.equal(result.totalPosts, 26);
  assert.equal(result.pageCount, 3);
  assert.deepEqual(result.posts, categoryPosts.slice(10, 20));
  result.posts.forEach((post, index) => assert.equal(post, categoryPosts[index + 10]));
  assert.deepEqual(getBlogCategories(orderedPosts).find((category) => category.name === 'AI, codex'), {
    name: 'AI, codex', count: 26,
  });
  const empty = paginate(orderedPosts, { category: 'unknown', page: '2' });
  assert.equal(empty.category, 'unknown');
  assert.equal(empty.totalPosts, 0);
  assert.equal(empty.pageCount, 1);
  assert.equal(empty.page, 1);
  assert.deepEqual(empty.posts, []);
  assert.equal(empty.redirectHref, '/blog?category=unknown');
});

test('invalid, nonpositive, noninteger and unsafe page parameters normalize to page one', () => {
  for (const page of ['', '0', '-1', '1.5', '2.0', 'NaN', 'Infinity', 'abc', '2e0', '+2', ' 2 ', '2\n', '2\r\n', '0x2', '9007199254740992', '99999999999999999999999']) {
    const result = paginate(orderedPosts, { category: '随笔', page });
    assert.equal(result.page, 1, page);
    assert.deepEqual(result.posts, orderedPosts.filter((post) => post.category === '随笔').slice(0, 10));
    assert.equal(result.redirectHref, '/blog?category=%E9%9A%8F%E7%AC%94', page);
  }
});

test('overflow clamps to the last filtered page and leading zeros normalize', () => {
  assert.equal(paginate(orderedPosts, { page: '999' }).page, 6);
  assert.equal(paginate(orderedPosts, { page: '999' }).redirectHref, '/blog?page=6');
  const filtered = paginate(orderedPosts, { category: 'AI, codex', page: '6' });
  assert.equal(filtered.page, 3);
  assert.equal(filtered.redirectHref, '/blog?category=AI%2C%20codex&page=3');
  assert.equal(paginate(orderedPosts, { page: '0002' }).page, 2);
  assert.equal(paginate(orderedPosts, { page: '0002' }).redirectHref, '/blog?page=2');
  assert.equal(paginate(orderedPosts, { page: '01' }).redirectHref, '/blog');
  assert.equal(paginate(orderedPosts, { page: '1' }).redirectHref, '/blog');
});

test('repeated query parameters choose their first value and redirect to single values', () => {
  const result = paginate(orderedPosts, { category: ['AI, codex', '随笔'], page: ['2', '3'] });
  assert.equal(result.category, 'AI, codex');
  assert.equal(result.page, 2);
  assert.equal(result.redirectHref, '/blog?category=AI%2C%20codex&page=2');
  assert.equal(paginate(orderedPosts, { page: ['invalid', '2'] }).redirectHref, '/blog');
  assert.equal(paginate(orderedPosts, { category: ['', '随笔'], page: ['2', '3'] }).redirectHref, '/blog?page=2');
  assert.equal(paginate(orderedPosts, { category: [] }).redirectHref, '/blog');
});

test('canonical list URLs preserve categories during paging and reset page for category links', () => {
  assert.equal(listHref(), '/blog');
  assert.equal(listHref(undefined, 1), '/blog');
  assert.equal(listHref(undefined, 2), '/blog?page=2');
  assert.equal(listHref('随笔', 2), '/blog?category=%E9%9A%8F%E7%AC%94&page=2');
  assert.equal(listHref('AI, codex'), '/blog?category=AI%2C%20codex');
  assert.equal(listHref('A&B #技术', 2), '/blog?category=A%26B%20%23%E6%8A%80%E6%9C%AF&page=2');
  assert.equal(paginate(orderedPosts).redirectHref, undefined);
  assert.equal(paginate(orderedPosts, { page: '2' }).redirectHref, undefined);
  assert.equal(paginate(orderedPosts, { category: 'AI, codex', page: '2' }).redirectHref, undefined);
  assert.equal(paginate(orderedPosts, { category: '' }).redirectHref, '/blog');
});

test('the real 53-post collection has six pages and 随笔 has two complete pages', () => {
  const contentDirectory = new URL('../content/blog/', import.meta.url);
  const source = readdirSync(contentDirectory).filter((name) => name.endsWith('.mdx')).map((name) => {
    const content = readFileSync(new URL(name, contentDirectory), 'utf8');
    const frontmatter = content.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---/);
    assert.ok(frontmatter, `missing frontmatter: ${name}`);
    const metadata = yaml.load(frontmatter[1]);
    return { slug: name.replace(/\.mdx$/, ''), category: metadata.category, date: String(metadata.date) };
  }).sort((a, b) => b.date.localeCompare(a.date));
  assert.equal(source.length, 53);
  const pages = Array.from({ length: 6 }, (_, index) => paginate(source, { page: String(index + 1) }));
  assert.deepEqual(pages.flatMap((page) => page.posts), source);
  assert.equal(pages[5].posts.length, 3);
  const categorySource = source.filter((post) => post.category === '随笔');
  assert.equal(categorySource.length, 20);
  const categoryPages = [1, 2].map((page) => paginate(source, { category: '随笔', page: String(page) }));
  assert.deepEqual(categoryPages.map((page) => page.posts.length), [10, 10]);
  assert.deepEqual(categoryPages.flatMap((page) => page.posts), categorySource);
});
