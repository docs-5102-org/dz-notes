import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

export default function DocsContentLayout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout 
      tree={source.getPageTree()} 
      sidebar={{ enabled: true }} 
      {...baseOptions()}
      >
      {children}
    </DocsLayout>
  );
}
