import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_PATH = '.agents/mdx-agent.md';
const GENERATED_NOTICE =
  'AUTO-GENERATED from .agents/mdx-agent.md; DO NOT EDIT.';

function normalizeNewlines(value) {
  return value.replace(/\r\n?/g, '\n');
}

function readRequiredScalar(frontmatter, key) {
  const line = frontmatter
    .split('\n')
    .find((candidate) => candidate.startsWith(`${key}:`));

  if (!line) {
    throw new Error(`Missing required frontmatter field: ${key}`);
  }

  const value = line.slice(key.length + 1).trim();

  if (!value) {
    throw new Error(`Missing required frontmatter field: ${key}`);
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

export function parseAgentSource(source) {
  const normalized = normalizeNewlines(source);
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!match) {
    throw new Error(
      'Shared agent source must start with closed YAML frontmatter',
    );
  }

  const frontmatter = match[1];
  const body = normalized.slice(match[0].length).replace(/^\n+/, '');

  return {
    name: readRequiredScalar(frontmatter, 'name'),
    description: readRequiredScalar(frontmatter, 'description'),
    frontmatter,
    body: body.endsWith('\n') ? body : `${body}\n`,
  };
}

export function renderClaudeAgent(source) {
  const { frontmatter, body } = parseAgentSource(source);

  return [
    '---',
    frontmatter,
    '---',
    '',
    `<!-- ${GENERATED_NOTICE} -->`,
    '',
    body,
  ].join('\n');
}

export function renderCodexAgent(source) {
  const { name, description, body } = parseAgentSource(source);

  return [
    `# ${GENERATED_NOTICE}`,
    `name = ${JSON.stringify(name)}`,
    `description = ${JSON.stringify(description)}`,
    `developer_instructions = ${JSON.stringify(body)}`,
    '',
  ].join('\n');
}

export async function syncAgents({ rootDir, check = false }) {
  const source = await readFile(resolve(rootDir, SOURCE_PATH), 'utf8');
  const outputs = new Map([
    ['.claude/agents/mdx-agent.md', renderClaudeAgent(source)],
    ['.codex/agents/mdx-agent.toml', renderCodexAgent(source)],
  ]);

  if (check) {
    const stale = [];

    for (const [relativePath, expected] of outputs) {
      try {
        const actual = normalizeNewlines(
          await readFile(resolve(rootDir, relativePath), 'utf8'),
        );

        if (actual !== expected) {
          stale.push(relativePath);
        }
      } catch (error) {
        if (error?.code !== 'ENOENT') {
          throw error;
        }

        stale.push(relativePath);
      }
    }

    if (stale.length > 0) {
      throw new Error(
        `Generated agent files are out of date: ${stale.join(', ')}`,
      );
    }

    return [];
  }

  for (const [relativePath, content] of outputs) {
    const target = resolve(rootDir, relativePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
  }

  return [...outputs.keys()];
}

async function main() {
  const args = process.argv.slice(2);
  const checkCount = args.filter((arg) => arg === '--check').length;

  if (args.some((arg) => arg !== '--check') || checkCount > 1) {
    throw new Error(`Unknown arguments: ${args.join(' ')}`);
  }

  const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const check = checkCount === 1;
  const written = await syncAgents({ rootDir, check });

  console.log(
    check
      ? 'Agent files are up to date.'
      : `Updated ${written.join(', ')}`,
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
