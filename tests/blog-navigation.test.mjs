import assert from 'node:assert/strict';
import test from 'node:test';
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
