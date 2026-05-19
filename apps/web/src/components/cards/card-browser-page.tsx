'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
const PAGE_SIZE = 20;

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
  if (sort === 'name') return 'name';
  if (sort === 'set') return 'set.name';
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
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const state = useLocalCardState();

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(filters.query), 350);
    return () => clearTimeout(timeout);
  }, [filters.query]);

  const orderBy = toOrderBy(filters.sort);
  const apiQuery = useMemo(() => buildApiQuery(filters, debouncedQuery), [filters, debouncedQuery]);

  const cardsQuery = useQuery({
    queryKey: queryKeys.cards.list(apiQuery, page, PAGE_SIZE, orderBy),
    queryFn: () => pokemonApi.cards(apiQuery, page, PAGE_SIZE, orderBy),
  });

  const setsQuery = useQuery({
    queryKey: queryKeys.sets.list('', 1, 100, '-releaseDate'),
    queryFn: () => pokemonApi.sets('', 1, 100, '-releaseDate'),
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

  return (
    <section>
      <CardHero
        query={filters.query}
        onQueryChange={(query) => setFilters((prev) => ({ ...prev, query }))}
        onSearch={() => setPage(1)}
      />
      <CardFilters
        value={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        setOptions={setOptions}
      />
      <div className="my-5 text-sm text-muted-foreground">
        {cardsQuery.data?.totalCount ?? cards.length} cards found
      </div>
      <CardGrid
        cards={cards}
        loading={cardsQuery.isLoading}
        emptyMessage="No cards found"
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
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </section>
  );
}
