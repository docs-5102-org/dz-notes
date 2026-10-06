/** Blog navigation uses summaries so it never loads or changes article bodies. */
export interface BlogNavigationPost {
  slug: string;
  category: string;
}

export function getBlogCategories(posts: readonly { category: string }[]) {
  const counts = new Map<string, number>();
  for (const post of posts) {
    counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
  }
  return [...counts].map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
}

export function filterBlogPosts<T extends { category: string }>(
  posts: readonly T[],
  category?: string,
): T[] {
  return posts.filter((post) => !category || post.category === category);
}

/** Input retains the site's newest-first order: previous is newer, next is older. */
export function getAdjacentBlogPosts<T extends BlogNavigationPost>(
  posts: readonly T[],
  slug: string,
): { previous: T | undefined; next: T | undefined } {
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return { previous: undefined, next: undefined };
  return { previous: posts[index - 1], next: posts[index + 1] };
}
