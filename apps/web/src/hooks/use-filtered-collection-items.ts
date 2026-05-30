'use client';

import { useMemo } from 'react';
import type { CollectionItem } from '@repo/shared';
import {
  getCollectionBrowseOptions,
  getCollectionStats,
  getFilteredCollectionItems,
  type CollectionBrowseState,
} from '@/lib/collection/collection-browse';

export function useFilteredCollectionItems(items: CollectionItem[], state: CollectionBrowseState) {
  return useMemo(
    () => ({
      items: getFilteredCollectionItems(items, state),
      options: getCollectionBrowseOptions(items),
      stats: getCollectionStats(items),
    }),
    [items, state],
  );
}
