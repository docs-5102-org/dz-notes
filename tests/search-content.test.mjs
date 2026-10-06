import assert from 'node:assert/strict';
import test from 'node:test';

const contentModule = await import('../scripts/search-content.mjs');

test('search extraction keeps MDX text and custom anchors without evaluating component imports', async () => {
  assert.equal(typeof contentModule.createSearchCompiler, 'function', 'search content compiler is missing');
  const compile = await contentModule.createSearchCompiler();
  const structuredData = await compile(`---
title: Example
---
import Missing from './does-not-exist.js'

# 连接池 [#pool]

正文查询关键字。

<Callout>

插件安装说明。

</Callout>

| 项目 | 内容 |
| --- | --- |
| 中文 | 表格关键字 |
`, '/tmp/search-example.mdx');

  assert.deepEqual(structuredData.headings, [{ id: 'pool', content: '连接池' }]);
  assert.equal(structuredData.contents.some((item) => item.content.includes('正文查询关键字') && item.heading === 'pool'), true);
  assert.equal(structuredData.contents.some((item) => item.content.includes('插件安装说明')), true);
  assert.equal(structuredData.contents.some((item) => item.content.includes('表格关键字')), true);
  assert.equal(structuredData.contents.some((item) => item.content.includes('does-not-exist')), false);
});

test('UTF-8 BOM frontmatter is excluded from search content', async () => {
  const compile = await contentModule.createSearchCompiler();
  const structuredData = await compile('\uFEFF---\ntitle: frontmatter-only-keyword\n---\n\n# Body\n\n正文内容。', '/tmp/bom-example.mdx');
  assert.equal(structuredData.contents.some((item) => item.content.includes('frontmatter-only-keyword')), false);
  assert.deepEqual(structuredData.headings, [{ id: 'body', content: 'Body' }]);
});
