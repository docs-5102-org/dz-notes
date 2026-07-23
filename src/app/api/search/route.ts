import {
  createSearchHandler,
  getUnifiedSearchIndexes,
} from '@/lib/search-index';

export const GET = createSearchHandler(getUnifiedSearchIndexes);
