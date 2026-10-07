import assert from 'node:assert/strict';
import test from 'node:test';
import { compile } from '@mdx-js/mdx';
import { rehypeCode } from 'fumadocs-core/mdx-plugins';
import config from '../source.config.ts';

async function highlight(language, code) {
  const options = typeof config.mdxOptions === 'function'
    ? await config.mdxOptions()
    : config.mdxOptions;
  const fence = '`'.repeat(3);

  return compile(`${fence}${language}\n${code}\n${fence}`, {
    rehypePlugins: [[rehypeCode, options.rehypeCodeOptions]],
  });
}

test('TypeScript aliases work in independent MDX compilation contexts', async () => {
  await highlight('typescript', 'const answer: number = 42;');
  const compiled = await highlight('ts', 'const answer: number = 42;');

  assert.match(String(compiled), /shiki/);
});

for (const [language, code] of [
  ['bat', 'echo hello'],
  ['batch', 'echo hello'],
  ['vbscript', 'Function Example()\nEnd Function'],
  ['lua', 'local answer = 42'],
  ['javascript', 'const answer = 42;'],
]) {
  test(`script examples render syntax highlighting for ${language}`, async () => {
    const compiled = await highlight(language, code);

    assert.match(String(compiled), /shiki/);
  });
}
