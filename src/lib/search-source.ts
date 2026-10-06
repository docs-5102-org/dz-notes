import { buildUnifiedIndexes } from './search-index.ts';
import type { AdvancedIndex } from 'fumadocs-core/search/server';

let unifiedIndexes: Promise<AdvancedIndex[]> | undefined;

// Development only: resolve current content again after module invalidation.
export function getUnifiedSearchIndexes() {
  unifiedIndexes ??= Promise.all([
    import('@/lib/source'),
    import('collections/server'),
  ])
    .then(([{ source }, { blog }]) => buildUnifiedIndexes(source.getPages(), blog))
    .catch((error) => {
      unifiedIndexes = undefined;
      throw error;
    });

  return unifiedIndexes;
}
