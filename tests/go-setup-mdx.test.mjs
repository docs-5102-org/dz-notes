import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const setupDocument = new URL('../content/docs/languages/go/setup.mdx', import.meta.url);

test('Go setup images use JSX style objects', () => {
  const source = readFileSync(setupDocument, 'utf8');

  assert.doesNotMatch(source, /<img\b[^>]*\bstyle="[^"]*"[^>]*>/);
  assert.match(source, /style=\{\{\s*width:\s*'400px'\s*\}\}/);
});
