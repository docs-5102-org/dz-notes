import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const filePath = new URL(
  '../content/docs/ai/prompts/web-development/html-css-development.mdx',
  import.meta.url,
);

test('html-css development prompt does not render an html root outside code fences', () => {
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  let inFence = false;

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inFence = !inFence;
      continue;
    }

    if (!inFence) {
      const prose = line.replace(/`[^`]*`/g, '');
      assert.doesNotMatch(prose, /<html\b/i);
    }
  }
});
