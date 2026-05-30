'use client';

import { useCallback, useMemo } from 'react';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  buildCollectionBrowseSearchParams,
  defaultCollectionBrowseState,
  getCollectionActiveFilterCount,
  parseCollectionBrowseState,
  type CollectionBrowseState,
} from '@/lib/collection/collection-browse';

export function useCollectionBrowseState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serializedSearchParams = searchParams.toString();

  const state = useMemo(
    () => parseCollectionBrowseState(new URLSearchParams(serializedSearchParams)),
    [serializedSearchParams],
  );

  const setState = useCallback(
    (patch: Partial<CollectionBrowseState>) => {
      const nextState = { ...state, ...patch };
      const params = buildCollectionBrowseSearchParams(
        nextState,
        new URLSearchParams(serializedSearchParams),
      );
      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ''}` as Route, { scroll: false });
    },
    [pathname, router, serializedSearchParams, state],
  );

  const reset = useCallback(() => {
    const params = buildCollectionBrowseSearchParams(
      defaultCollectionBrowseState,
      new URLSearchParams(serializedSearchParams),
    );
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ''}` as Route, { scroll: false });
  }, [pathname, router, serializedSearchParams]);

  return {
    state,
    setState,
    reset,
    activeFilterCount: getCollectionActiveFilterCount(state),
  };
}
