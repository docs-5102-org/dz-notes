import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // JSX supported
      title: appName,
    },
    links: [
      {
        type: 'button',
        text: '首页',
        on: 'nav',      // 只在顶部 navbar 显示
        url: '/',
        active: 'nested-url',
        secondary: false,    // 次要链接，在右侧区域，默认是主要连接为false
      },
      {
        type: 'button',
        text: '文档',
        on: 'nav',      // 只在顶部 navbar 显示
        url: '/docs/',
        active: 'nested-url',
        secondary: false,    // 次要链接，在右侧区域，默认是主要连接为false
      },
      {
        type: 'button',     // 靠右显示
        text: '博客',
        on: 'nav',      // 只在顶部 navbar 显示
        url: '/blog',
        active: 'nested-url', // 控制导航链接何时高亮显示为"当前页"。
        secondary: false,    // 次要链接，在右侧区域，默认是主要连接为false
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    // searchToggle: {
    //   enabled: false,
    // },
    // themeSwitch: {
    //   enabled: false,
    // },
  };
}
