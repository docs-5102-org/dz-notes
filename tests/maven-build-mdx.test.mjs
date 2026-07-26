import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  compile,
  run,
} from '../node_modules/.pnpm/@mdx-js+mdx@3.1.1/node_modules/@mdx-js/mdx/index.js';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as runtime from 'react/jsx-runtime';

const buildDocument = new URL(
  '../content/docs/languages/java/engineering-ecosystem/dependency-management/maven/build.mdx',
  import.meta.url,
);

test('Maven build page renders its resource-filter placeholder literally', async () => {
  const source = readFileSync(buildDocument, 'utf8');
  const compiled = await compile(source, { outputFormat: 'function-body' });
  const module = await run(compiled, { ...runtime, baseUrl: import.meta.url });

  assert.doesNotThrow(() => renderToStaticMarkup(createElement(module.default)));
});
