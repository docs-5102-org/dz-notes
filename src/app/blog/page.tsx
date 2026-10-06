import Link from 'next/link';
import { getAllBlogPosts, getBlogSlug } from '@/lib/blog';
import { filterBlogPosts, getBlogCategories } from '@/lib/blog-navigation';

export default async function BlogPage({ searchParams }: PageProps<'/blog'>) {
  const blogPosts = getAllBlogPosts();
  const query = await searchParams;
  const category = Array.isArray(query.category) ? query.category[0] : query.category;
  const categories = getBlogCategories(blogPosts);
  const visiblePosts = filterBlogPosts(blogPosts, category);

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
        <Link href="/blog" scroll={false} aria-current={!category ? 'page' : undefined}>
          全部 <span>{blogPosts.length}</span>
        </Link>
        {categories.map((item) => (
          <Link
            key={item.name}
            href={`/blog?category=${encodeURIComponent(item.name)}`}
            scroll={false}
            aria-current={category === item.name ? 'page' : undefined}
          >
            {item.name} <span>{item.count}</span>
          </Link>
        ))}
      </nav>

      <div className="dz-blog-results" aria-live="polite" aria-atomic="true">
        {category ? `${category} · ${visiblePosts.length} 篇` : '全部文章'}
      </div>
      <div className="dz-blog-list">
        {visiblePosts.map((post) => (
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
      {visiblePosts.length === 0 ? (
        <div className="dz-blog-empty">
          <p>没有找到这个分类的文章。</p>
          <Link href="/blog">查看全部文章</Link>
        </div>
      ) : null}
    </div>
  );
}
