import Link from 'next/link';
import { getBlogMDXComponents } from '@/components/blog/mdx';
import { getAllBlogPosts, getBlogPostBySlug, getBlogSlug } from '@/lib/blog';
import { getAdjacentBlogPosts } from '@/lib/blog-navigation';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export default async function BlogDetailPage(props: PageProps<'/blog/[slug]'>) {
  const params = await props.params;
  const post = getBlogPostBySlug(params.slug);

  if (!post) notFound();

  const { body: MDX } = await post.load();
  const summaries = getAllBlogPosts().map((item) => ({
    slug: getBlogSlug(item.info.path),
    category: item.category,
    title: item.title,
  }));
  const { previous, next } = getAdjacentBlogPosts(summaries, params.slug);

  return (
    <article className="dz-blog-detail">
      <nav className="dz-blog-breadcrumb" aria-label="面包屑">
        <ol>
          <li><Link href="/">首页</Link></li>
          <li><Link href="/blog">博客</Link></li>
          <li aria-current="page">{post.title}</li>
        </ol>
      </nav>
      <Link className="dz-blog-back" href="/blog">← 返回博客</Link>
      <header className="dz-blog-detail__header">
        <div className="dz-blog-detail__meta">
          <Link className="dz-badge" href={`/blog?category=${encodeURIComponent(post.category)}`}>
            {post.category}
          </Link>
          <time dateTime={post.date}>{post.date}</time>
        </div>
        <h1 className="dz-blog-detail__title">{post.title}</h1>
        {(post.excerpt ?? post.description) ? (
          <p className="dz-blog-detail__excerpt">{post.excerpt ?? post.description}</p>
        ) : null}
      </header>
      <div className="dz-prose prose">
        <MDX components={getBlogMDXComponents()} />
      </div>
      {(previous || next) ? (
        <nav className="dz-blog-adjacent" aria-label="文章导航">
          {previous ? (
            <Link href={`/blog/${previous.slug}`} rel="prev">
              <span>← 上一篇</span>
              <strong>{previous.title}</strong>
            </Link>
          ) : null}
          {next ? (
            <Link href={`/blog/${next.slug}`} rel="next">
              <span>下一篇 →</span>
              <strong>{next.title}</strong>
            </Link>
          ) : null}
        </nav>
      ) : null}
      <Link className="dz-blog-back" href="/blog">查看全部文章</Link>
    </article>
  );
}

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({
    slug: getBlogSlug(post.info.path),
  }));
}

export async function generateMetadata(
  props: PageProps<'/blog/[slug]'>,
): Promise<Metadata> {
  const params = await props.params;
  const post = getBlogPostBySlug(params.slug);

  if (!post) notFound();

  return {
    title: post.title,
    description: post.excerpt ?? post.description,
  };
}
