import Link from 'next/link';
import { getAllBlogPosts, getBlogSlug } from '@/lib/blog';
import { getCategoryBadgeClass } from '@/lib/site';

export default function BlogPage() {
  const blogPosts = getAllBlogPosts();

  return (
    <div className="dz-blog">
      <header className="dz-section-head">
        <h1 className="dz-section-head__title">{'\u535a\u5ba2'}</h1>
        <p className="dz-section-head__description">
          {'\u6280\u672f\u6587\u7ae0\u3001\u5b66\u4e60\u7b14\u8bb0\u4e0e\u8e29\u5751\u8bb0\u5f55\u3002'}
        </p>
      </header>

      <div className="dz-blog-list">
        {blogPosts.map((post) => (
          <Link
            key={post.info.path}
            href={`/blog/${getBlogSlug(post.info.path)}`}
            className="dz-blog-card"
          >
            <div className="dz-blog-card__top">
              <span className={`dz-badge ${getCategoryBadgeClass(post.category)}`}>
                {post.category}
              </span>
              <time className="dz-blog-card__date">{post.date}</time>
            </div>
            <h2 className="dz-blog-card__title">{post.title}</h2>
            <p className="dz-blog-card__excerpt">{post.excerpt ?? post.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
