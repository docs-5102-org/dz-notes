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

const BLOG_PAGE_SIZE = 10;

type BlogListQuery = {
  category?: string | string[];
  page?: string | string[];
};

/** Category links omit the page; pagination links keep the exact category string. */
export function getBlogListHref(category?: string, page = 1): string {
  const params: string[] = [];
  if (category) params.push(`category=${encodeURIComponent(category)}`);
  if (page > 1) params.push(`page=${page}`);
  return params.length > 0 ? `/blog?${params.join('&')}` : '/blog';
}

/** Filter before slicing, retaining the input's newest-first order and post identity. */
export function getBlogPagination<T extends { category: string }>(
  posts: readonly T[],
  query: BlogListQuery = {},
) {
  const rawCategory = Array.isArray(query.category) ? query.category[0] : query.category;
  const category = rawCategory || undefined;
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const parsedPage = rawPage && /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  const requestedPage = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const filteredPosts = filterBlogPosts(posts, category);
  const totalPosts = filteredPosts.length;
  const pageCount = Math.max(1, Math.ceil(totalPosts / BLOG_PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const offset = (page - 1) * BLOG_PAGE_SIZE;
  const canonicalPage = page > 1 ? String(page) : undefined;
  const needsRedirect = Array.isArray(query.category) || Array.isArray(query.page)
    || rawCategory !== category || rawPage !== canonicalPage;

  return {
    category,
    page,
    pageCount,
    totalPosts,
    start: totalPosts === 0 ? 0 : offset + 1,
    end: Math.min(offset + BLOG_PAGE_SIZE, totalPosts),
    posts: filteredPosts.slice(offset, offset + BLOG_PAGE_SIZE),
    redirectHref: needsRedirect ? getBlogListHref(category, page) : undefined,
  };
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
