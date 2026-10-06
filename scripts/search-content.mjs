import { createProcessor } from '@mdx-js/mdx';
import { frontmatter } from 'fumadocs-core/content/md/frontmatter';
import { applyMdxPreset, remarkInclude } from 'fumadocs-mdx/config';

export function parseSearchFrontmatter(raw) {
  return frontmatter(raw.replace(/^\uFEFF/, ''));
}

// Compile only to extract VFile metadata. Never execute MDX component imports,
// render React, highlight code, or request image dimensions for a search index.
export async function createSearchCompiler(options = {}) {
  const preset = await applyMdxPreset({
    ...options,
    rehypeCodeOptions: false,
    remarkImageOptions: false,
  })('bundler');
  const processors = new Map();

  function getProcessor(format) {
    if (!processors.has(format)) {
      processors.set(format, createProcessor({
        ...preset,
        format,
        remarkPlugins: [remarkInclude, ...preset.remarkPlugins ?? []],
      }));
    }
    return processors.get(format);
  }

  return async (raw, filePath, metadata) => {
    const matter = parseSearchFrontmatter(raw);
    const file = await getProcessor(filePath.endsWith('.mdx') ? 'mdx' : 'md').process({
      value: matter.content,
      path: filePath,
      data: {
        frontmatter: metadata ?? matter.data,
        _compiler: { addDependency() {} },
        _getProcessor: getProcessor,
      },
    });
    if (!file.data.structuredData) {
      throw new Error(`Missing search structuredData: ${filePath}`);
    }
    return file.data.structuredData;
  };
}
