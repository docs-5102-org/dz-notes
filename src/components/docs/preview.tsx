import { withPreviewStyles } from '@/components/docs/preview-utils';

interface PreviewProps {
  html: string;
  height?: number;
}

export function Preview({ html, height = 300 }: PreviewProps) {
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
