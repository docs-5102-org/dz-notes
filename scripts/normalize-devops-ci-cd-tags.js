const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const tagsFile = path.join(root, 'src/lib/doc-tags.ts');
const docsRoot = path.join(root, 'content/docs/devops/ci-cd');

const tagMapSource = fs.readFileSync(tagsFile, 'utf8');
const displayEntries = [
  ...tagMapSource.matchAll(/^\s*(?:'([^']+)'|([A-Za-z0-9_-]+))\s*:\s*'([^']+)'\s*,/gm),
];

const displayToSlug = new Map();
for (const match of displayEntries) {
  const slug = match[1] || match[2];
  const display = match[3];
  if (!displayToSlug.has(display)) displayToSlug.set(display, slug);
}

const aliases = new Map(
  Object.entries({
    'CI/CD': 'ci-cd',
    'Github Actions': 'github-actions',
    'GitHub Actions': 'github-actions',
    'act runner': 'act-runner',
    Actions: 'actions',
    '计划任务': 'scheduled-tasks',
    '自动化': 'automation',
    '持续集成': 'continuous-integration',
    '持续交付': 'continuous-delivery',
    '工作流': 'workflow',
    '系统管理': 'system-management',
  }),
);

function slugifyAscii(tag) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mapTag(tag) {
  if (aliases.has(tag)) return aliases.get(tag);
  if (displayToSlug.has(tag)) return displayToSlug.get(tag);
  if (/^[\x00-\x7F]+$/.test(tag)) return slugifyAscii(tag);
  return null;
}

function walk(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.mdx') && entry.name !== 'index.mdx') result.push(full);
  }
  return result;
}

const files = walk(docsRoot);
const unknowns = [];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const updated = source.replace(/tag:\r?\n((?:  - .*\r?\n)+)/, (_, block) => {
    const rawTags = block
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => line.replace(/^  - /, ''));

    const mapped = [];
    for (const tag of rawTags) {
      const slug = mapTag(tag);
      if (!slug) {
        unknowns.push({ file, tag });
        if (!mapped.includes(tag)) mapped.push(tag);
      } else if (!mapped.includes(slug)) {
        mapped.push(slug);
      }
    }

    return `tag:\n${mapped.map((tag) => `  - ${tag}`).join('\n')}\n`;
  });

  if (updated !== source) {
    fs.writeFileSync(file, updated, 'utf8');
  }
}

if (unknowns.length > 0) {
  console.error('Unknown tags:');
  for (const item of unknowns) {
    console.error(`${item.file}: ${item.tag}`);
  }
  process.exit(1);
}

console.log(`Normalized tags in ${files.length} files.`);
