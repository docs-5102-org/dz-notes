import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const gradleStarter = new URL(
  '../content/docs/languages/java/engineering-ecosystem/dependency-management/gradle/starter.mdx',
  import.meta.url,
);

test('Gradle starter uses MDX-compatible HTML and link syntax', () => {
  const source = readFileSync(gradleStarter, 'utf8');

  assert.doesNotMatch(source, /<br(?!\s*\/>)/);
  assert.doesNotMatch(source, /^-\s+[^[]+：https?:\/\/\S+$/gm);
});
