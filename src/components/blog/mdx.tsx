import type { ComponentProps } from 'react';
import { getMDXComponents } from '@/components/mdx';

function BlogTable(props: ComponentProps<'table'>) {
  return (
    <div
      className="dz-blog-table-scroll"
      role="region"
      aria-label="表格（可横向滚动）"
      tabIndex={0}
    >
      <table {...props} />
    </div>
  );
}

export function getBlogMDXComponents() {
  return getMDXComponents({ table: BlogTable });
}
