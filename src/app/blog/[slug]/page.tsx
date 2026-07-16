import { getMDXComponents } from '@/components/mdx';
import { getAllBlogPosts, getBlogPostBySlug, getBlogSlug } from '@/lib/blog';
import { getCategoryBadgeClass } from '@/lib/site';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export default async function BlogDetailPage(props: PageProps<'/blog/[slug]'>) {
  const params = await props.params;
  const post = getBlogPostBySlug(params.slug);

  if (!post) notFound();

  const { body: MDX } = await post.load();

  return (
    <article className="dz-blog-detail">
      <div className="dz-blog-detail__meta">
        <span className={`dz-badge ${getCategoryBadgeClass(post.category)}`}>{post.category}</span>
        <time>{post.date}</time>
      </div>
      <h1 className="dz-blog-detail__title">{post.title}</h1>
      <p className="dz-blog-detail__excerpt">{post.excerpt ?? post.description}</p>
      <div className="dz-prose">
        <MDX components={getMDXComponents()} />
      </div>
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
