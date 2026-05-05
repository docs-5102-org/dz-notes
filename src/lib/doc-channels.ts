import { source } from '@/lib/source';

const channelColorMap: Record<string, string> = {
  notion: 'var(--channel-notion)',
  web: 'var(--channel-web)',
  mobile_native: 'var(--channel-notion)',
  cross_platform: 'var(--channel-web)',
  languages: 'var(--channel-coding)',
  coding: 'var(--channel-coding)',
  java: 'var(--channel-coding)',
  go: 'var(--channel-coding)',
  php: 'var(--channel-coding)',
  python: 'var(--channel-coding)',
  middleware: 'var(--channel-coding)',
  storage: 'var(--channel-coding)',
  'game-development': 'var(--channel-web)',
  bigdata: 'var(--channel-coding)',
  devops: 'var(--channel-coding)',
  blockchain: 'var(--channel-web)',
  ai: 'var(--channel-web)',
};

const channelTitleFallbackMap: Record<string, string> = {
  notion: 'Notion',
  web: 'Web 开发',
  mobile_native: '移动端原生',
  cross_platform: '跨平台',
  languages: '编程语言',
  coding: '编程学习',
  java: 'Java',
  go: 'Go',
  php: 'PHP',
  python: 'Python',
  middleware: '中间件',
  storage: '存储',
  'game-development': '游戏开发',
  bigdata: '大数据',
  devops: 'DevOps',
  blockchain: '区块链',
  ai: 'AI',
};

const channelDescriptionFallbackMap: Record<string, string> = {
  notion: '知识管理、数据库设计与模板实践',
  web: '前端框架、工程化与页面实现',
  mobile_native: 'iOS、Android 与原生应用开发',
  cross_platform: 'Flutter、React Native 与多端方案',
  languages: 'Java、Go、PHP、Python 与游戏开发笔记',
  coding: '算法、数据结构与基础编程笔记',
  java: 'Java 语言、框架与后端开发实践',
  go: 'Go 语言、工程规范与框架实践',
  php: 'PHP 基础、环境配置与 CMS 实践',
  python: 'Python 基础、环境配置与工具实践',
  middleware: '消息队列、缓存、搜索与分库分表笔记',
  storage: '数据库与对象存储相关笔记',
  'game-development': '游戏引擎、入门资源与开发笔记',
  bigdata: '数据处理、仓库建模与计算框架',
  devops: 'Linux、容器、部署运维与 CI/CD',
  blockchain: '链上基础、以太坊开发与 Web3 笔记',
  ai: '模型应用、提示词工程与多模态实践',
};

const channelOrderMap: Record<string, number> = {
  notion: 10,
  web: 20,
  mobile_native: 30,
  cross_platform: 40,
  languages: 50,
  coding: 60,
  java: 70,
  go: 80,
  php: 90,
  python: 100,
  middleware: 110,
  storage: 120,
  'game-development': 130,
  bigdata: 140,
  devops: 150,
  blockchain: 160,
  ai: 170,
};

export type DocChannel = {
  slug: string;
  title: string;
  href: string;
  color: string;
  description: string;
  meta: string;
};

// 从页面 frontmatter 中解析频道标题；如果缺失，则按顶层 slug 使用稳定的兜底标题。
function getChannelTitle(page: ReturnType<typeof source.getPages>[number]) {
  if (page.data.subTitle?.trim()) return page.data.subTitle;
  return channelTitleFallbackMap[page.slugs[0]] ?? page.data.title;
}

// 从页面 frontmatter 中解析频道描述；如果缺失，则回退到预设的频道描述文案。
function getChannelDescription(page: ReturnType<typeof source.getPages>[number]) {
  const description = page.data.description?.trim();
  if (description) return description;
  return channelDescriptionFallbackMap[page.slugs[0]] ?? '';
}

// 基于 `/content/docs/*/index.mdx` 动态生成顶层频道列表，避免手动维护频道配置。
export function getDocChannels(): DocChannel[] {
  return source
    .getPages()
    .filter((page) => page.slugs.length === 1)
    .map((page) => {
      const slug = page.slugs[0];

      return {
        slug,
        title: getChannelTitle(page),
        href: page.url,
        color: channelColorMap[slug] ?? 'var(--channel-coding)',
        description: getChannelDescription(page),
        meta: '',
      };
    })
    .sort((a, b) => {
      const orderA = channelOrderMap[a.slug] ?? Number.MAX_SAFE_INTEGER;
      const orderB = channelOrderMap[b.slug] ?? Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) return orderA - orderB;
      return a.slug.localeCompare(b.slug);
    });
}
