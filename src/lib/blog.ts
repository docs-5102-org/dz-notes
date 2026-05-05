import { blog } from 'collections/server';

export function getAllBlogPosts() {
  return [...blog].sort((a, b) => b.date.localeCompare(a.date));
}

export function getBlogSlug(path: string) {
  return path.replace(/\.mdx?$/, '');
}

export function getBlogPostBySlug(slug: string) {
  return getAllBlogPosts().find((post) => getBlogSlug(post.info.path) === slug);
}
