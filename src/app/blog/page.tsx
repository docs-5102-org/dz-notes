import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAllBlogPosts, getBlogSlug } from '@/lib/blog';
import { getBlogCategories, getBlogListHref, getBlogPagination } from '@/lib/blog-navigation';

export default async function BlogPage({ searchParams }: PageProps<'/blog'>) {
  const blogPosts = getAllBlogPosts();
  const query = await searchParams;
  const pagination = getBlogPagination(blogPosts, query);
  if (pagination.redirectHref) redirect(pagination.redirectHref);
  const { category, page, pageCount, totalPosts, start, end } = pagination;
  const categories = getBlogCategories(blogPosts);
  const pageHref = (targetPage: number) => `${getBlogListHref(category, targetPage)}#blog-list-top`;

  return (
    <div className="dz-blog">
      <header className="dz-section-head">
        <p className="dz-blog-eyebrow">文章与记录</p>
        <h1 className="dz-section-head__title">博客</h1>
        <p className="dz-section-head__description">
          技术文章、学习笔记与踩坑记录，共 {blogPosts.length} 篇。
        </p>
      </header>

      <nav className="dz-blog-filters" aria-label="博客分类">
        <Link href="/blog#blog-list-top" aria-current={!category ? 'page' : undefined}>
          全部 <span>{blogPosts.length}</span>
        </Link>
        {categories.map((item) => (
          <Link
            key={item.name}
            href={`${getBlogListHref(item.name)}#blog-list-top`}
            aria-current={category === item.name ? 'page' : undefined}
          >
            {item.name} <span>{item.count}</span>
          </Link>
        ))}
      </nav>

      <div id="blog-list-top" className="dz-blog-results" aria-live="polite" aria-atomic="true">
        {category ?? '全部文章'} · {totalPosts} 篇
        {totalPosts > 0 ? ` · 第 ${start}–${end} 篇` : ''}
        {pageCount > 1 ? ` · 第 ${page}/${pageCount} 页` : ''}
      </div>
      <div className="dz-blog-list">
        {pagination.posts.map((post) => (
          <Link
            key={post.info.path}
            href={`/blog/${getBlogSlug(post.info.path)}`}
            className="dz-blog-card"
          >
            <time className="dz-blog-card__date" dateTime={post.date}>{post.date}</time>
            <div className="dz-blog-card__body">
              <h2 className="dz-blog-card__title">{post.title}</h2>
              {(post.excerpt ?? post.description) ? (
                <p className="dz-blog-card__excerpt">{post.excerpt ?? post.description}</p>
              ) : null}
              <span className="dz-badge">{post.category}</span>
            </div>
          </Link>
        ))}
      </div>
      {totalPosts === 0 ? (
        <div className="dz-blog-empty">
          <p>没有找到这个分类的文章。</p>
          <Link href="/blog">查看全部文章</Link>
        </div>
      ) : null}
      {pageCount > 1 ? (
        <nav className="dz-blog-pagination" aria-label="博客分页">
          {page > 1 ? (
            <Link className="dz-blog-pagination__control" href={pageHref(page - 1)} rel="prev">
              上一页
            </Link>
          ) : (
            <span className="dz-blog-pagination__control" aria-disabled="true">上一页</span>
          )}
          <ol className="dz-blog-pagination__numbers">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
              <li key={number}>
                <Link
                  className="dz-blog-pagination__control"
                  href={pageHref(number)}
                  aria-label={`第 ${number} 页`}
                  aria-current={page === number ? 'page' : undefined}
                >
                  {number}
                </Link>
              </li>
            ))}
          </ol>
          <span className="dz-blog-pagination__state" aria-current="page">第{page}/{pageCount}页</span>
          {page < pageCount ? (
            <Link className="dz-blog-pagination__control" href={pageHref(page + 1)} rel="next">
              下一页
            </Link>
          ) : (
            <span className="dz-blog-pagination__control" aria-disabled="true">下一页</span>
          )}
        </nav>
      ) : null}
    </div>
  );
}
