import fs from 'fs';
import path from 'path';

import { withPreviewStyles } from '@/components/docs/preview-utils';

interface PreviewFileProps {
  src: string;
  height?: number;
}

export function PreviewFile({ src, height = 300 }: PreviewFileProps) {
  const html = fs.readFileSync(path.join(process.cwd(), 'content', src), 'utf-8');

  return (
    <iframe
      srcDoc={withPreviewStyles(html)}
      width="100%"
      height={height}
      style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}
      sandbox="allow-scripts"
    />
  );
}
