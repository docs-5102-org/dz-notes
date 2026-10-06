import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { gzip } from 'node:zlib';
import { load as parseYaml } from 'js-yaml';
import { loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { buildUnifiedIndexes } from '../src/lib/search-index.ts';
import { buildSearchSnapshot } from '../src/lib/search-snapshot.ts';
import { docsRoute } from '../src/lib/site.ts';
import { createSearchCompiler, parseSearchFrontmatter } from './search-content.mjs';

const started = performance.now();
// Use the same collection schemas and source loader as the site, but read raw
// metadata instead of importing compiled MDX modules (including their images).
const config = await import('../.source/source.config.mjs');
const globalOptions = typeof config.default.mdxOptions === 'function'
  ? await config.default.mdxOptions()
  : config.default.mdxOptions ?? {};
const compileDocs = await createSearchCompiler({ ...globalOptions, ...config.docs.docs.mdxOptions });
const compileBlog = await createSearchCompiler({ ...globalOptions, ...config.blog.mdxOptions });

async function readCollection(collection, metaCollection) {
  const directory = path.resolve(collection.dir);
  const paths = (await readdir(directory, { recursive: true }))
    .map((relative) => relative.replaceAll('\\', '/'))
    .sort();
  const docs = [];
  const meta = [];

  for (const relative of paths) {
    const isDoc = /\.mdx?$/.test(relative);
    const isMeta = metaCollection && /\.(json|ya?ml)$/.test(relative);
    if (!isDoc && !isMeta) continue;

    const fullPath = path.join(directory, relative);
    const raw = (await readFile(fullPath, 'utf8')).replace(/^\uFEFF/, '');
    const data = isDoc ? parseSearchFrontmatter(raw).data
      : relative.endsWith('.json') ? JSON.parse(raw) : parseYaml(raw);
    const schema = isDoc ? collection.schema : metaCollection.schema;
    let validated;
    try {
      validated = schema ? await schema.parseAsync(data) : data;
    } catch (error) {
      throw new Error(`Invalid search metadata: ${fullPath}`, { cause: error });
    }
    const entry = { ...validated, info: { path: relative, fullPath } };
    (isDoc ? docs : meta).push(entry);
  }

  return { docs, meta };
}

const [docCollection, blogCollection] = await Promise.all([
  readCollection(config.docs.docs, config.docs.meta),
  readCollection(config.blog),
]);
const source = loader({
  baseUrl: docsRoute,
  source: {
    files: [
      ...docCollection.docs.map((entry) => ({ type: 'page', path: entry.info.path, absolutePath: entry.info.fullPath, data: entry })),
      ...docCollection.meta.map((entry) => ({ type: 'meta', path: entry.info.path, absolutePath: entry.info.fullPath, data: entry })),
    ],
  },
  plugins: [lucideIconsPlugin()],
});

function loadStructuredData(entry, compile) {
  return async () => {
    const filePath = path.resolve(entry.info.fullPath);
    const raw = await readFile(filePath, 'utf8');
    return { structuredData: await compile(raw, filePath, entry) };
  };
}

const docPages = source.getPages().map((page) => ({
  url: page.url,
  data: {
    title: page.data.title,
    description: page.data.description,
    load: loadStructuredData(page.data, compileDocs),
  },
}));
const blogPosts = blogCollection.docs.map((post) => ({
  ...post,
  load: loadStructuredData(post, compileBlog),
}));
const indexes = await buildUnifiedIndexes(docPages, blogPosts);
const snapshot = await buildSearchSnapshot(indexes);
const compressed = await promisify(gzip)(JSON.stringify(snapshot));
const outputDir = path.resolve('.search');
const outputPath = path.join(outputDir, 'snapshot.json.gz');
await mkdir(outputDir, { recursive: true });
await writeFile(`${outputPath}.tmp`, compressed);
await rename(`${outputPath}.tmp`, outputPath);

console.log(`[search] ${indexes.length} pages, ${snapshot.fallback.length} records, ${(compressed.length / 1024 / 1024).toFixed(2)} MiB, ${Math.round(performance.now() - started)}ms`);
