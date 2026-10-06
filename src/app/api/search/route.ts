import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { gunzip } from 'node:zlib';
import { createSearchHandler } from '@/lib/search-index';
import { restoreSearchSnapshot, type SearchSnapshot } from '@/lib/search-snapshot';

export const runtime = 'nodejs';

export const GET = createSearchHandler(async () => {
  if (process.env.NODE_ENV === 'development') {
    const [{ getUnifiedSearchIndexes }, { createKeywordSearch }] = await Promise.all([
      import('@/lib/search-source'),
      import('@/lib/search-index'),
    ]);
    return createKeywordSearch(await getUnifiedSearchIndexes());
  }

  const snapshotPath = path.join(process.cwd(), '.search', 'snapshot.json.gz');
  const content = await promisify(gunzip)(await readFile(snapshotPath));
  const snapshot = JSON.parse(content.toString('utf8')) as SearchSnapshot;
  return restoreSearchSnapshot(snapshot);
});
