import { defineCollections, defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';
import path from 'path/win32';
import fs from 'node:fs';

// You can customize Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema.extend({
      subTitle: z.string().optional(), // 扩展二级标题, 可选 
      category: z.array(z.string()).optional(),
      tag: z.array(z.string()).optional(),
      // 标签（多值，用于跨频道关键词聚合）
      // transform：过滤掉空字符串，容错偶尔多打的空标签
      // default([])：没有 tags 字段时返回空数组，不返回 undefined
      // tags:
      //   - 图标
      //   - 设计资源
      //   - UI
      // 或
      // tags: ["图标","设计资源","UI"]
      // ---
      tags: z
        .array(z.string())
        .optional()
        .default([])
        .transform(tags => tags.filter(tag => tag.trim() !== '')),
      date: z.coerce.string().optional(), // 先进行类型转换，在进行字符串输出
      source: z.string().optional(),
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

const plantumlGrammar = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), 'grammars/plantuml.tmLanguage.json'),
    'utf-8'
  )
);

export const blog = defineCollections({
  type: 'doc',
  dir: 'content/blog',
  schema: pageSchema.extend({
    date: z.coerce.string(), // 先进行类型转换，在进行字符串输出
    category: z.string(),
    excerpt: z.string().optional(),
  }),
  postprocess: {
    includeProcessedMarkdown: true,
  },
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      langs: ['bash', 'properties', 'cmd', 'groovy', 'ini',

        {
          ...plantumlGrammar,
          name: 'plantuml',
          aliases: ['puml', 'pu', 'wsd'], // 文件里 fileTypes 里的扩展名都可以作别名
        },

      ],
      langAlias: {
        // 非 Shiki 内置的别名才需要声明
        cmd: 'bat',
        dotenv: 'ini',
        env: 'ini',
        gradle: 'groovy',
        gitignore: 'ini',
        ignore: 'ini',
        properties: 'ini',
        shell: 'bash',
        redis: 'bash',
      },
    },
  },
});
