'use client';

import type { Route } from 'next';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@repo/shared';
import { pokemonApi } from '@/lib/pokemon/api';
import { useServerCollection } from '@/hooks/use-server-collection';
import { CardHero } from '@/components/cards/card-hero';
import { CardFilters, type DiscoveryFilters } from '@/components/cards/card-filters';
import { CardGrid } from '@/components/cards/card-grid';
import { PaginationBar } from '@/components/shared/pagination-bar';

const hasAdvancedQuerySyntax = (value: string): boolean => /[:()"]/g.test(value);
const escapeQueryValue = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const quoteIfNeeded = (value: string): string => {
  const escaped = escapeQueryValue(value);
  return /\s/.test(escaped) ? `"${escaped}"` : escaped;
};
const DEFAULT_PAGE_SIZE = 20;
const SETS_SELECTOR_PAGE_SIZE = 100;
const pageSizeOptions = [20, 40, 60, 80, 100] as const;
const sortOptions = ['relevance', 'number', 'name', 'set', 'rarity'] as const;
const scopeOptions = ['all', 'favorites', 'owned', 'wishlist'] as const;
const DEFAULT_SORT = 'relevance';

const initialFilters: DiscoveryFilters = {
  query: '',
  set: '',
  type: '',
  rarity: [],
  supertype: '',
  scope: 'all',
  sort: DEFAULT_SORT,
};

const toOrderBy = (sort: string): string | undefined => {
  if (sort === 'number') return 'number';
  if (sort === 'name') return 'name';
  if (sort === 'set') return 'set.name,number';
  if (sort === 'rarity') return 'rarity';
  return undefined;
};

const buildApiQuery = (filters: DiscoveryFilters, query: string): string => {
  const terms: string[] = [];
  const trimmed = query.trim();
  if (trimmed)
    terms.push(hasAdvancedQuerySyntax(trimmed) ? trimmed : `name:"*${escapeQueryValue(trimmed)}*"`);
  if (filters.set) terms.push(`set.id:${filters.set}`);
  if (filters.type) terms.push(`types:${quoteIfNeeded(filters.type)}`);
  if (filters.rarity.length) {
    const rarityTerms = filters.rarity.map((rarity) => `rarity:${quoteIfNeeded(rarity)}`);
    terms.push(`(${rarityTerms.join(' OR ')})`);
  }
  if (filters.supertype) terms.push(`supertype:${quoteIfNeeded(filters.supertype)}`);
  return terms.join(' ');
};

const getTrimmedParam = (params: URLSearchParams, key: string): string => params.get(key)?.trim() ?? '';

const getValidatedParam = <T extends readonly string[]>(
  params: URLSearchParams,
  key: string,
  validValues: T,
  fallback: T[number],
): T[number] => {
  const value = getTrimmedParam(params, key);
  return (validValues as readonly string[]).includes(value) ? (value as T[number]) : fallback;
};

const getRarityParams = (params: URLSearchParams): string[] => {
  const values = params
    .getAll('rarity')
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);

  return [...new Set(values)];
};

const getPageParam = (params: URLSearchParams): number => {
  const page = Number(params.get('page'));
  return Number.isInteger(page) && page > 0 ? page : 1;
};

const getPageSizeParam = (params: URLSearchParams): number => {
  const pageSize = Number(params.get('pageSize'));
  return pageSizeOptions.includes(pageSize as (typeof pageSizeOptions)[number]) ? pageSize : DEFAULT_PAGE_SIZE;
};

const readCardsUrlState = (params: URLSearchParams) => ({
  filters: {
    query: getTrimmedParam(params, 'q'),
    set: getTrimmedParam(params, 'set'),
    type: getTrimmedParam(params, 'type'),
    rarity: getRarityParams(params),
    supertype: getTrimmedParam(params, 'supertype'),
    scope: getValidatedParam(params, 'scope', scopeOptions, initialFilters.scope),
    sort: getValidatedParam(params, 'sort', sortOptions, DEFAULT_SORT),
  } satisfies DiscoveryFilters,
  page: getPageParam(params),
  pageSize: getPageSizeParam(params),
});

const buildCardsUrlSearch = (filters: DiscoveryFilters, page: number, pageSize: number): string => {
  const params = new URLSearchParams();
  const query = filters.query.trim();

  if (query) params.set('q', query);
  if (filters.set) params.set('set', filters.set);
  if (filters.type) params.set('type', filters.type);
  filters.rarity.forEach((rarity) => params.append('rarity', rarity));
  if (filters.supertype) params.set('supertype', filters.supertype);
  if (filters.scope !== initialFilters.scope) params.set('scope', filters.scope);
  if (filters.sort !== initialFilters.sort) params.set('sort', filters.sort);
  if (pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(pageSize));
  if (page > 1) params.set('page', String(page));

  return params.toString();
};

export function CardBrowserPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const serializedSearchParams = searchParams.toString();
  const urlState = useMemo(
    () => readCardsUrlState(new URLSearchParams(serializedSearchParams)),
    [serializedSearchParams],
  );
  const [draftFilters, setDraftFilters] = useState<DiscoveryFilters>(() => urlState.filters);
  const [appliedFilters, setAppliedFilters] = useState<DiscoveryFilters>(() => urlState.filters);
  const [heroQuery, setHeroQuery] = useState(() => urlState.filters.query);
  const [page, setPage] = useState(() => urlState.page);
  const [draftPageSize, setDraftPageSize] = useState(() => urlState.pageSize);
  const [pageSize, setPageSize] = useState(() => urlState.pageSize);
  const [useLargeImages, setUseLargeImages] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const gridTopRef = useRef<HTMLDivElement | null>(null);
  const state = useServerCollection();

  useEffect(() => {
    setHeroQuery(urlState.filters.query);
    setDraftFilters(urlState.filters);
    setAppliedFilters(urlState.filters);
    setDraftPageSize(urlState.pageSize);
    setPageSize(urlState.pageSize);
    setPage(urlState.page);
  }, [urlState]);

  const orderBy = toOrderBy(appliedFilters.sort);
  const apiQuery = useMemo(() => buildApiQuery(appliedFilters, appliedFilters.query), [appliedFilters]);
  const hasPendingChanges = JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters) || draftPageSize !== pageSize;

  const applySearch = (nextFilters = { ...draftFilters, query: heroQuery }, nextPageSize = draftPageSize) => {
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setDraftPageSize(nextPageSize);
    setPageSize(nextPageSize);
    setPage(1);
    const query = buildCardsUrlSearch(nextFilters, 1, nextPageSize);
    router.push((`/cards${query ? `?${query}` : ''}`) as Route);
  };

  const resetFilters = () => {
    setHeroQuery('');
    applySearch(initialFilters, DEFAULT_PAGE_SIZE);
  };

  const cardsQuery = useQuery({
    queryKey: queryKeys.cards.list(apiQuery, page, pageSize, orderBy),
    queryFn: () => pokemonApi.cards(apiQuery, page, pageSize, orderBy),
    placeholderData: keepPreviousData,
  });

  const setsQuery = useQuery({
    queryKey: queryKeys.sets.list('', 1, SETS_SELECTOR_PAGE_SIZE, '-releaseDate'),
    queryFn: () => pokemonApi.sets('', 1, SETS_SELECTOR_PAGE_SIZE, '-releaseDate'),
  });

  const setOptions = useMemo(
    () => (setsQuery.data?.data ?? []).map((set) => ({ label: set.name, value: set.id })),
    [setsQuery.data?.data],
  );

  const cards = useMemo(
    () =>
      (cardsQuery.data?.data ?? []).filter((card) => {
        if (appliedFilters.scope === 'favorites' && !state.isFavorite(card.id)) return false;
        if (appliedFilters.scope === 'owned' && !state.isOwned(card.id)) return false;
        if (appliedFilters.scope === 'wishlist' && !state.isWishlist(card.id)) return false;
        return true;
      }),
    [cardsQuery.data?.data, appliedFilters.scope, state],
  );

  const handlePageChange = (nextPage: number) => {
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setPage(nextPage);
    const query = buildCardsUrlSearch(appliedFilters, nextPage, pageSize);
    router.push((`/cards${query ? `?${query}` : ''}`) as Route);
  };

  return (
    <section>
      <CardHero
        query={heroQuery}
        onQueryChange={(query) => {
          setHeroQuery(query);
          setDraftFilters((prev) => ({ ...prev, query }));
        }}
        onSearch={() => applySearch()}
      />
      <CardFilters
        value={draftFilters}
        onChange={setDraftFilters}
        setOptions={setOptions}
        pageSize={draftPageSize}
        onPageSizeChange={(next) => {
          setDraftPageSize(next);
        }}
        useLargeImages={useLargeImages}
        onUseLargeImagesChange={setUseLargeImages}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
        onApply={() => applySearch(draftFilters)}
        onReset={resetFilters}
        hasPendingChanges={hasPendingChanges}
      />
      <div ref={gridTopRef} />
      <div className="my-5 text-sm text-muted-foreground">
        {cardsQuery.data?.totalCount ?? cards.length} cards found
      </div>
      <CardGrid
        cards={cards}
        loading={cardsQuery.isLoading}
        emptyMessage="No cards found"
        useLargeImages={useLargeImages}
        getActionState={(id) => ({
          isFavorite: state.isFavorite(id),
          isOwned: state.isOwned(id),
          isWishlisted: state.isWishlist(id),
          onToggleFavorite: () => state.toggleFavorite(id),
          onToggleOwned: () => state.toggleOwned(id),
          onToggleWishlist: () => state.toggleWishlist(id),
        })}
      />
      <div className="mt-6 flex items-center justify-center">
        <PaginationBar
          page={page}
          totalCount={cardsQuery.data?.totalCount ?? 0}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      </div>
    </section>
  );
}
