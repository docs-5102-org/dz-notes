import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const phoneDocument = new URL(
  '../content/docs/languages/java/core-foundations/regular-expressions/foreign-phone.mdx',
  import.meta.url,
);

test('phone regex tables escape alternation pipes', () => {
  const source = readFileSync(phoneDocument, 'utf8');
  const rows = source
    .split(/\r?\n/)
    .filter((line) => line.startsWith('| ') && line.includes('`'));

  assert.ok(rows.length > 0);

  for (const row of rows) {
    const expressions = [...row.matchAll(/`([^`]+)`/g)].map((match) => match[1]);

    for (const expression of expressions) {
      assert.doesNotMatch(expression, /(?<!\\)\|/);
    }
  }
});
