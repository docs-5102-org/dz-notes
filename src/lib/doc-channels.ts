import fs from 'node:fs';
import path from 'node:path';
import { load } from 'js-yaml';
import docsMeta from '../../content/docs/meta.json';

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

// 从 content/docs/meta.json 的 pages 字段拿到真实一级频道。
// 示例：["web", "languages", "..."] => ["web", "languages"]
// 示例：["ai", { type: "separator" }, "..."] => ["ai"]
const topLevelChannelSlugs = docsMeta.pages.filter(
  (page): page is string => typeof page === 'string' && !page.startsWith('...'),
);

export type DocChannel = {
  slug: string;
  title: string;
  href: string;
  color: string;
  description: string;
  meta: string;
};

type ChannelFrontmatter = {
  title?: string;
  subTitle?: string;
  description?: string;
};

function getFrontmatter(filePath: string): ChannelFrontmatter {
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, 'utf8');
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  if (!match) return {};

  const data = load(match[1]);
  return data && typeof data === 'object' ? data as ChannelFrontmatter : {};
}

function getChannelFrontmatter(slug: string) {
  return getFrontmatter(path.join(process.cwd(), 'content', 'docs', slug, 'index.mdx'));
}

// 从页面 frontmatter 中解析频道标题；如果缺失，则按顶层 slug 使用稳定的兜底标题。
function getChannelTitle(slug: string, frontmatter: ChannelFrontmatter) {
  if (frontmatter.subTitle?.trim()) return frontmatter.subTitle;
  return channelTitleFallbackMap[slug] ?? frontmatter.title ?? slug;
}

// 从页面 frontmatter 中解析频道描述；如果缺失，则回退到预设的频道描述文案。
function getChannelDescription(slug: string, frontmatter: ChannelFrontmatter) {
  const description = frontmatter.description?.trim();
  if (description) return description;
  return channelDescriptionFallbackMap[slug] ?? '';
}

// 只按 `content/docs/meta.json` 中声明的一级 `pages` 生成频道列表。
// 不再使用 `source.getPages().filter(page => page.slugs.length === 1)`：
// Fumadocs 的子目录 `meta.json` 如果配置了 `root: true`，会把二级目录提升成 root 页面，
// 这会导致 `languages/java`、`languages/go` 等二级分类被误判成一级频道。
// 这里先拿到真实的顶层 slug，再读取频道首页 frontmatter 补齐标题和描述。
export function getDocChannels(): DocChannel[] {
  return topLevelChannelSlugs
    .map((slug) => {
      const frontmatter = getChannelFrontmatter(slug);

      return {
        slug,
        title: getChannelTitle(slug, frontmatter),
        href: `/docs/${slug}`,
        color: channelColorMap[slug] ?? 'var(--channel-coding)',
        description: getChannelDescription(slug, frontmatter),
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
