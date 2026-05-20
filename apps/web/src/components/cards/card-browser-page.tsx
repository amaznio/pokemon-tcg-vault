'use client';

import type { Route } from 'next';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@repo/shared';
import { pokemonApi } from '@/lib/pokemon/api';
import { useLocalCardState } from '@/hooks/use-local-card-state';
import { CardHero } from '@/components/cards/card-hero';
import { CardFilters, type DiscoveryFilters } from '@/components/cards/card-filters';
import { CardGrid } from '@/components/cards/card-grid';
import { PaginationBar } from '@/components/shared/pagination-bar';

const hasAdvancedQuerySyntax = (value: string): boolean => /[:()"]/g.test(value);
const escapeQueryValue = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const quoteIfNeeded = (value: string): string => (/\s/.test(value) ? `"${value}"` : value);
const DEFAULT_PAGE_SIZE = 20;
const SETS_SELECTOR_PAGE_SIZE = 100;

const initialFilters: DiscoveryFilters = {
  query: '',
  set: '',
  type: '',
  rarity: [],
  supertype: '',
  scope: 'all',
  sort: 'relevance',
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

export function CardBrowserPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentUrlQuery = searchParams.get('q') ?? '';
  const [filters, setFilters] = useState(initialFilters);
  const [heroQuery, setHeroQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [useLargeImages, setUseLargeImages] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const gridTopRef = useRef<HTMLDivElement | null>(null);
  const state = useLocalCardState();

  useEffect(() => {
    setHeroQuery(currentUrlQuery);
    setFilters((prev) => ({ ...prev, query: currentUrlQuery }));
    setPage(1);
  }, [currentUrlQuery]);

  const orderBy = toOrderBy(filters.sort);
  const apiQuery = useMemo(() => buildApiQuery(filters, filters.query), [filters]);

  const commitHeroSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    const next = heroQuery.trim();
    if (next) params.set('q', next);
    else params.delete('q');
    params.delete('page');
    const query = params.toString();
    router.push((`/cards${query ? `?${query}` : ''}`) as Route);
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
        if (filters.scope === 'favorites' && !state.isFavorite(card.id)) return false;
        if (filters.scope === 'owned' && !state.isOwned(card.id)) return false;
        if (filters.scope === 'wishlist' && !state.isWishlist(card.id)) return false;
        return true;
      }),
    [cardsQuery.data?.data, filters.scope, state],
  );

  const handlePageChange = (nextPage: number) => {
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setPage(nextPage);
  };

  return (
    <section>
      <CardHero
        query={heroQuery}
        onQueryChange={setHeroQuery}
        onSearch={commitHeroSearch}
      />
      <CardFilters
        value={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        setOptions={setOptions}
        pageSize={pageSize}
        onPageSizeChange={(next) => {
          setPageSize(next);
          setPage(1);
        }}
        useLargeImages={useLargeImages}
        onUseLargeImagesChange={setUseLargeImages}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
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
