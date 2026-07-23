import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const versionDocument = new URL(
  '../content/docs/languages/java/web-frameworks/spring-boot/spring-boot-version-intro.mdx',
  import.meta.url,
);

test('Spring Boot documentation version placeholder is literal text', () => {
  const source = readFileSync(versionDocument, 'utf8');

  assert.match(source, /docs\/\\\{version\\\}\/reference/);
  assert.match(source, /链接中的 `\{version\}` 替换成目标版本号/);
});
