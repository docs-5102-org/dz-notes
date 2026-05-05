import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

// @see https://nextjs.org/docs/app/api-reference/config/next-config-js/images
// @see https://nextjs.org/docs/messages/next-image-unconfigured-host
const nextConfig = {
  reactStrictMode: true,  // 默认就是 true，Next.js 13+ 开始默认开启，作用：仅在开发环境生效的检查工具
  images: {
    remotePatterns: [
      new URL('https://picsum.photos/**'),
      //  {
      //   protocol: 'https',
      //   hostname: 'picsum.photos',
      // },
      // 其他外部图片域名也在这里加
      // { hostname: 'images.unsplash.com' },
      // { hostname: 'cdn.yoursite.com' },
    ],
  },
};

export default withMDX(nextConfig);