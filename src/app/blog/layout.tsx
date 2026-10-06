import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import './blog.css';

export default function BlogLayout({ children }: LayoutProps<'/blog'>) {
  const options = baseOptions();

  return (
    <HomeLayout
      {...options}
      className="dz-blog-shell"
      links={options.links?.map((link) => ({ ...link, on: 'all' }))}
    >
      {children}
    </HomeLayout>
  );
}
