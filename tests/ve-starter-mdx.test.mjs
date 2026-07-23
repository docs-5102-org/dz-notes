import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const velocityDocument = new URL(
  '../content/docs/languages/java/template-engines/velocity/ve-starter.mdx',
  import.meta.url,
);

test('Velocity ${reference} example is rendered as literal code', () => {
  const source = readFileSync(velocityDocument, 'utf8');

  assert.match(source, /- `\$\{reference\}` - 正式引用，用于消除歧义/);
});
