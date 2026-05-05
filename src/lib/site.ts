export const appName = 'dz-notes';

export const siteDescription =
  '个人技术文档与博客，持续整理 Notion、Web 开发、移动端、AI、区块链与工程实践内容。';

export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

export const gitConfig = {
  user: 'docs-5102-org',
  repo: 'dz-notes',
  branch: 'main',
};

export const homeTags = [
  'Notion',
  'Next.js',
  'React',
  'AI',
  '区块链',
  'Fumadocs',
] as const;

export function getCategoryBadgeClass(category: string) {
  switch (category) {
    case 'Web':
      return 'dz-badge-web';
    case 'Notion':
      return 'dz-badge-notion';
    default:
      return 'dz-badge-coding';
  }
}
