import assert from 'node:assert/strict';
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const javaRoot = fileURLToPath(
  new URL('../content/docs/languages/java/', import.meta.url),
);

const expectedDomains = {
  'core-foundations': [
    'index',
    'jvm',
    'java-8',
    'concurrent-programming',
    'annotations',
    'regular-expressions',
  ],
  'template-engines': ['index', 'freemarker', 'thymeleaf', 'velocity'],
  'persistence-frameworks': ['index', 'jpa', 'hibernate', 'mybatis'],
  'web-frameworks': [
    'index',
    'struts2',
    'spring',
    'spring-boot',
    'spring-cloud',
    'spring-webflux',
  ],
  'web-containers': ['index', 'tomcat', 'resin'],
  'engineering-ecosystem': [
    'index',
    'dependency-management',
    'logging',
    'scheduling',
    'security-frameworks',
    'crawler-frameworks',
    'font-processing',
  ],
};

const expectedConcurrencyTopics = {
  fundamentals: [
    'index',
    'intro',
    'atomic-variables',
    'cas',
    'volatile',
    'synchronized',
  ],
  threads: [
    'index',
    'intro',
    'thread-class',
    'runnable',
    'thread-status',
    'daemon-thread',
    'thread-interrupt',
    'safe-stop',
    'thread-sleep',
    'thread-join',
    'thread-is-alive',
    'thread-priority',
    'thread-set-name',
    'thread-wait-notify',
    'thread-local',
    'thread-groups',
  ],
  'async-tasks': [
    'index',
    'callable-vs-future',
    'future',
    'completable-future',
    'completion-service',
    'ffcc-difference',
  ],
  'thread-pools': [
    'index',
    'executor-service',
    'scheduled-executor-service',
    'executors',
    'rejected-execution-exception',
    'singleton-thread-pool-manager',
    'spring-boot-thread-pool',
  ],
  'concurrent-collections': [
    'index',
    'concurrent-map',
    'concurrent-hash-map',
    'blocking-queues',
  ],
  'locks-and-synchronizers': [
    'index',
    'locks',
    'count-down-latch',
  ],
  'practice-and-resources': [
    'index',
    'multithreaded-database',
    'grobo-utils',
    'reference',
  ],
};

const expectedDependencyManagementTopics = {
  maven: [
    'index',
    'starter',
    'settings-xml',
    'command',
    'scope',
    'version',
    'build',
    'module-build',
    'profile',
    'package',
    'install',
    'repository',
    'nexus',
    'publish-flow',
    'make-plugin',
    'manifest',
    'scm',
    'config-old-tomcat',
    'problem',
  ],
  gradle: ['index', 'starter'],
};

const legacyEntries = [
  'annotation',
  'crawler',
  'freemarker',
  'hibernate',
  'java-concurrent',
  'java8-tutorial',
  'jpa',
  'jvm',
  'log',
  'mybatis',
  'regex',
  'resin',
  'schedule',
  'security-framework',
  'spring',
  'spring-boot',
  'spring-cloud',
  'spring-web-flux',
  'struts2',
  'thymeleaf',
  'tomcat',
  'velocity',
  'intro.mdx',
  'ttf.mdx',
];

function walkFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(target) : [target];
  });
}

function resolveMetaEntry(directory, entry) {
  const page = join(directory, `${entry}.mdx`);
  const child = join(directory, entry);
  if (existsSync(page)) return page;
  if (existsSync(child) && statSync(child).isDirectory()) return child;
  return null;
}

test('Java documentation uses the approved domain structure', () => {
  const rootMeta = JSON.parse(
    readFileSync(join(javaRoot, 'meta.json'), 'utf8'),
  );

  assert.deepEqual(rootMeta.pages, [
    'index',
    'learning-resources',
    'core-foundations',
    'template-engines',
    'persistence-frameworks',
    'web-frameworks',
    'web-containers',
    'engineering-ecosystem',
  ]);

  for (const [domain, pages] of Object.entries(expectedDomains)) {
    const directory = join(javaRoot, domain);
    const meta = JSON.parse(readFileSync(join(directory, 'meta.json'), 'utf8'));
    assert.deepEqual(meta.pages, pages, `${domain}/meta.json page order`);
    assert.ok(existsSync(join(directory, 'index.mdx')), `${domain} index`);
  }

  const fontDirectory = join(
    javaRoot,
    'engineering-ecosystem',
    'font-processing',
  );
  const fontMeta = JSON.parse(
    readFileSync(join(fontDirectory, 'meta.json'), 'utf8'),
  );
  assert.deepEqual(fontMeta.pages, ['index', 'ttf-fonts']);

  for (const entry of legacyEntries) {
    assert.equal(existsSync(join(javaRoot, entry)), false, `legacy ${entry}`);
  }
});

test('every Java meta page points to an existing page or directory', () => {
  const files = walkFiles(javaRoot);
  const metaFiles = files.filter((file) => file.endsWith('meta.json'));

  for (const metaFile of metaFiles) {
    const directory = dirname(metaFile);
    const meta = JSON.parse(readFileSync(metaFile, 'utf8'));
    for (const entry of meta.pages ?? []) {
      assert.ok(
        resolveMetaEntry(directory, entry),
        `${metaFile}: missing ${entry}`,
      );
    }
  }
});

test('Spring overview links follow its meta page order', () => {
  const springDirectory = join(javaRoot, 'web-frameworks', 'spring');
  const springMeta = JSON.parse(
    readFileSync(join(springDirectory, 'meta.json'), 'utf8'),
  );
  const springIndex = readFileSync(join(springDirectory, 'index.mdx'), 'utf8');
  const articleSlugs = [
    ...springIndex.matchAll(
      /\]\(\/docs\/languages\/java\/web-frameworks\/spring\/([^)]+)\)/g,
    ),
  ].map((match) => match[1]);

  assert.deepEqual(articleSlugs, springMeta.pages.slice(1));
});

test('Java concurrency documentation uses semantic topic groups', () => {
  const concurrencyRoot = join(
    javaRoot,
    'core-foundations',
    'concurrent-programming',
  );
  const rootMeta = JSON.parse(
    readFileSync(join(concurrencyRoot, 'meta.json'), 'utf8'),
  );

  assert.deepEqual(rootMeta.pages, [
    'index',
    'fundamentals',
    'threads',
    'async-tasks',
    'thread-pools',
    'concurrent-collections',
    'locks-and-synchronizers',
    'practice-and-resources',
  ]);

  for (const [topic, pages] of Object.entries(expectedConcurrencyTopics)) {
    const directory = join(concurrencyRoot, topic);
    const meta = JSON.parse(readFileSync(join(directory, 'meta.json'), 'utf8'));
    assert.deepEqual(meta.pages, pages, `${topic}/meta.json page order`);
  }

  assert.deepEqual(
    JSON.parse(
      readFileSync(
        join(concurrencyRoot, 'thread-pools', 'executors', 'meta.json'),
        'utf8',
      ),
    ).pages,
    [
      'index',
      'cached-thread-pool',
      'fixed-thread-pool',
      'scheduled-thread-pool',
      'single-thread-executor',
    ],
  );
  assert.deepEqual(
    JSON.parse(
      readFileSync(
        join(
          concurrencyRoot,
          'concurrent-collections',
          'blocking-queues',
          'meta.json',
        ),
        'utf8',
      ),
    ).pages,
    ['index', 'intro', 'principle', 'application'],
  );
  assert.deepEqual(
    JSON.parse(
      readFileSync(
        join(
          concurrencyRoot,
          'locks-and-synchronizers',
          'locks',
          'meta.json',
        ),
        'utf8',
      ),
    ).pages,
    ['index', 'intro', 'reentrant-lock'],
  );

  for (const legacy of [
    'concurrent',
    'queue',
    'thread',
    'concurrent-1.mdx',
    'concurrent-2.mdx',
    'concurrent-3.mdx',
    'concurrent-4.mdx',
  ]) {
    assert.equal(existsSync(join(concurrencyRoot, legacy)), false, legacy);
  }
});

test('Java dependency management documentation has complete navigation', () => {
  const dependencyRoot = join(
    javaRoot,
    'engineering-ecosystem',
    'dependency-management',
  );
  const rootMeta = JSON.parse(
    readFileSync(join(dependencyRoot, 'meta.json'), 'utf8'),
  );

  assert.deepEqual(rootMeta.pages, ['index', 'maven', 'gradle']);
  assert.ok(existsSync(join(dependencyRoot, 'index.mdx')));

  for (const [topic, pages] of Object.entries(
    expectedDependencyManagementTopics,
  )) {
    const directory = join(dependencyRoot, topic);
    const meta = JSON.parse(readFileSync(join(directory, 'meta.json'), 'utf8'));
    assert.deepEqual(meta.pages, pages, `${topic}/meta.json page order`);
    assert.ok(existsSync(join(directory, 'index.mdx')), `${topic} index`);
  }
});

test('Java migration preserves the complete content inventory', () => {
  const files = walkFiles(javaRoot);
  const count = (extension) =>
    files.filter((file) => extname(file) === extension).length;

  assert.equal(count('.mdx'), 278);
  assert.equal(count('.json'), 50);
  assert.equal(files.length - count('.mdx') - count('.json'), 4);
});
