'use client';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@repo/shared';
import { CardFilters, type DiscoveryFilters } from '@/components/cards/card-filters';
import { CardGrid } from '@/components/cards/card-grid';
import { pokemonApi } from '@/lib/pokemon/api';
import { useCollection } from '@/hooks/use-collection';

const initialFilters: DiscoveryFilters = { query: '', set: '', type: '', rarity: '', supertype: '', scope: 'all' };
const hasAdvancedQuerySyntax = (value: string): boolean => /[:()"]/g.test(value);
const quoteIfNeeded = (value: string): string => (/\s/.test(value) ? `"${value}"` : value);
const escapeQueryValue = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const buildCardsApiQuery = (filters: DiscoveryFilters, baseQuery: string): string => {
  const trimmedQuery = baseQuery.trim();
  const terms: string[] = [];

  if (trimmedQuery) {
    terms.push(hasAdvancedQuerySyntax(trimmedQuery) ? trimmedQuery : `name:"*${escapeQueryValue(trimmedQuery)}*"`);
  }
  if (filters.set) {
    terms.push(`set.id:${filters.set}`);
  }
  if (filters.type) {
    terms.push(`types:${quoteIfNeeded(filters.type)}`);
  }
  if (filters.rarity) {
    terms.push(`rarity:${quoteIfNeeded(filters.rarity)}`);
  }
  if (filters.supertype) {
    terms.push(`supertype:${quoteIfNeeded(filters.supertype)}`);
  }

  if (!terms.length) return '';
  if (terms.length === 1) return terms[0] ?? '';
  return terms.join(' ');
};

export default function CardsPage() {
  const [filters, setFilters] = useState<DiscoveryFilters>(initialFilters);
  const [debouncedQuery, setDebouncedQuery] = useState(filters.query);
  const [page, setPage] = useState(1);
  const collection = useCollection();
  const setOptionsQuery = useQuery({
    queryKey: queryKeys.sets.list('', 1, 100, '-releaseDate'),
    queryFn: () => pokemonApi.sets('', 1, 100, '-releaseDate'),
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, 350);

    return () => clearTimeout(timeout);
  }, [filters.query]);

  const apiQuery = useMemo(() => buildCardsApiQuery(filters, debouncedQuery), [filters, debouncedQuery]);

  const cardsQuery = useQuery({
    queryKey: queryKeys.cards.list(apiQuery, page, 20),
    queryFn: () => pokemonApi.cards(apiQuery, page, 20),
  });

  const filtered = useMemo(() => {
    const cards = cardsQuery.data?.data ?? [];
    return cards.filter((card) => {
      if (filters.scope === 'favorites' && !collection.isFavorite(card.id)) return false;
      if (filters.scope === 'owned' && !collection.isOwned(card.id)) return false;
      if (filters.scope === 'wishlist' && !collection.isWishlisted(card.id)) return false;
      return true;
    });
  }, [cardsQuery.data?.data, filters, collection]);

  const setOptions = useMemo(
    () =>
      (setOptionsQuery.data?.data ?? []).map((set) => ({
        value: set.id,
        label: set.name,
      })),
    [setOptionsQuery.data?.data],
  );

  return (
    <section className="space-y-5">
      <CardFilters value={filters} onChange={(next) => { setFilters(next); setPage(1); }} onSearch={() => setPage(1)} setOptions={setOptions} />
      {cardsQuery.data?.stale ? <p className="text-sm text-amber-700">Showing stale cache while upstream is unavailable.</p> : null}
      <CardGrid
        cards={filtered}
        loading={cardsQuery.isLoading}
        emptyMessage="No cards found"
        getActionState={(cardId) => ({
          isFavorite: collection.isFavorite(cardId),
          isOwned: collection.isOwned(cardId),
          isWishlisted: collection.isWishlisted(cardId),
          onToggleFavorite: () => collection.toggleFavorite(cardId),
          onToggleOwned: () => collection.toggleOwned(cardId),
          onToggleWishlist: () => collection.toggleWishlist(cardId),
        })}
      />
      <div className="flex items-center gap-2">
        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span className="text-sm text-slate-600">Page {page}</span>
        <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </section>
  );
}
