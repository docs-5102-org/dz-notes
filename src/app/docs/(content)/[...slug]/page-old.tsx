import { getMDXComponents } from '@/components/mdx';
import { getDocChannels } from '@/lib/doc-channels';
import { gitConfig } from '@/lib/shared';
import { getPageImage, getPageMarkdownUrl, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// 根据当前页面 slug 动态推导所属频道和二级分类，用于页内顶部分类展示。
function getPageCategories(page: ReturnType<typeof source.getPage>) {
  if (!page) return [];

  const categories: string[] = [];
  const docChannels = getDocChannels();
  const channel = docChannels.find((item) => item.slug === page.slugs[0]);

  if (channel?.title) {
    categories.push(channel.title);
  }

  if (page.slugs.length >= 2) {
    const sectionPage = source.getPage([page.slugs[0], page.slugs[1]]);
    const sectionTitle =
      sectionPage?.data.subTitle ??
      sectionPage?.data.title ??
      decodeURI(page.slugs[1]);

    if (sectionTitle && !categories.includes(sectionTitle) && sectionTitle !== page.data.title) {
      categories.push(sectionTitle);
    }
  }

  return categories;
}

export default async function Page(props: PageProps<'/docs/[...slug]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;
  const categories = getPageCategories(page);

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      {categories.length > 0 ? (
        <div className="dz-tags mb-2" aria-label="Categories">
          {categories.map((category) => (
            <span key={category} className="dz-tag">
              {category}
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[...slug]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
