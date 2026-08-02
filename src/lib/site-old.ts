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

export const docChannels = [
  {
    slug: 'notion',
    title: 'Notion',
    href: '/docs/notion',
    color: 'var(--channel-notion)',
    description: '知识管理、数据库设计与模板实践',
    meta: '',
  },
  {
    slug: 'web',
    title: 'Web 开发',
    href: '/docs/web',
    color: 'var(--channel-web)',
    description: '前端框架、工程化与页面实现',
    meta: '',
  },
  {
    slug: 'mobile_native',
    title: '移动端原生',
    href: '/docs/mobile_native',
    color: 'var(--channel-notion)',
    description: 'iOS、Android 与原生应用开发',
    meta: '',
  },
  {
    slug: 'cross_platform',
    title: '跨平台',
    href: '/docs/cross_platform',
    color: 'var(--channel-web)',
    description: 'Flutter、React Native 与多端方案',
    meta: '',
  },
  {
    slug: 'coding',
    title: '编程学习',
    href: '/docs/coding',
    color: 'var(--channel-coding)',
    description: '算法、数据结构与基础编程笔记',
    meta: '',
  },
  {
    slug: 'java',
    title: 'Java',
    href: '/docs/java',
    color: 'var(--channel-coding)',
    description: 'Java 语言、框架与后端开发实践',
    meta: '',
  },
  {
    slug: 'bigdata',
    title: '大数据',
    href: '/docs/bigdata',
    color: 'var(--channel-coding)',
    description: '数据处理、仓库建模与计算框架',
    meta: '',
  },
  {
    slug: 'office-design',
    title: '办公设计',
    href: '/docs/office-design',
    color: 'var(--channel-notion)',
    description: '办公软件、文档排版、演示设计与效率工作流笔记',
    meta: '',
  },
  {
    slug: 'operating-system',
    title: '操作系统',
    href: '/docs/operating-system',
    color: 'var(--channel-coding)',
    description: 'Windows、Linux、macOS 与系统基础使用笔记',
    meta: '',
  },
  {
    slug: 'media-creator',
    title: '自媒体',
    href: '/docs/media-creator',
    color: 'var(--channel-coding)',
    description: '互联网平台传播信息',
    meta: '',
  },
  {
    slug: 'digital-marketing',
    title: '数字营销',
    href: '/docs/digital-marketing',
    color: 'var(--channel-web)',
    description: '工作室项目、广告联盟、流量变现与网赚项目笔记',
    meta: '',
  },
  {
    slug: 'network-security',
    title: '网络',
    href: '/docs/network-security',
    color: 'var(--channel-coding)',
    description: '网络安全基础、协议、部署与故障排查笔记',
    meta: '',
  },
  {
    slug: 'devops',
    title: 'DevOps',
    href: '/docs/devops',
    color: 'var(--channel-coding)',
    description: 'Linux、容器、部署运维与 CI/CD',
    meta: '',
  },
  {
    slug: 'blockchain',
    title: '区块链',
    href: '/docs/blockchain',
    color: 'var(--channel-web)',
    description: '链上基础、以太坊开发与 Web3 笔记',
    meta: '',
  },
  {
    slug: 'ai',
    title: 'AI',
    href: '/docs/ai',
    color: 'var(--channel-web)',
    description: '模型应用、提示词工程与多模态实践',
    meta: '',
  },
] as const;

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
