'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CardDetail } from '@repo/shared';
import { useLocalCardState } from '@/hooks/use-local-card-state';
import { pokemonApi } from '@/lib/pokemon/api';
import type { DashboardStats, MiniCardItem, RecentCardItem } from '@/lib/dashboard/types';

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

const mapCardToMiniItem = (card: CardDetail): MiniCardItem => ({
  id: card.id,
  name: card.name,
  setName: card.setName,
  number: card.id.split('-')[1] ?? card.id,
  image: card.imageLarge ?? card.imageSmall ?? '',
});

const mapCardToRecentItem = (card: CardDetail, index: number): RecentCardItem => ({
  ...mapCardToMiniItem(card),
  viewedAtLabel: index === 0 ? 'Latest' : `${index + 1} back`,
});

async function fetchCardsByIds(ids: string[]) {
  const results = await Promise.all(ids.map((id) => pokemonApi.card(id).then((res) => res.data).catch(() => null)));
  return results.filter((card): card is CardDetail => Boolean(card));
}

export function useDashboardData() {
  const state = useLocalCardState();

  const recentIds = useMemo(() => state.recentlyViewedIds.slice(0, 3), [state.recentlyViewedIds]);
  const favoriteIds = useMemo(() => [...state.favoriteIds].slice(0, 4), [state.favoriteIds]);
  const wishlistIds = useMemo(() => [...state.wishlistIds].slice(0, 4), [state.wishlistIds]);
  const ownedIds = useMemo(() => [...state.ownedIds], [state.ownedIds]);

  const recentQuery = useQuery({
    queryKey: ['dashboard.recent.cards', ...recentIds],
    enabled: recentIds.length > 0,
    queryFn: () => fetchCardsByIds(recentIds),
  });

  const favoritesQuery = useQuery({
    queryKey: ['dashboard.favorite.cards', ...favoriteIds],
    enabled: favoriteIds.length > 0,
    queryFn: () => fetchCardsByIds(favoriteIds),
  });

  const wishlistQuery = useQuery({
    queryKey: ['dashboard.wishlist.cards', ...wishlistIds],
    enabled: wishlistIds.length > 0,
    queryFn: () => fetchCardsByIds(wishlistIds),
  });

  const ownedCardsQuery = useQuery({
    queryKey: ['dashboard.owned.cards', ...ownedIds],
    enabled: ownedIds.length > 0,
    queryFn: () => fetchCardsByIds(ownedIds),
  });

  const totalSetsQuery = useQuery({
    queryKey: ['dashboard.sets.totalCount'],
    queryFn: async () => {
      const response = await pokemonApi.sets('', 1, 1);
      return response.totalCount;
    },
  });

  return useMemo(() => {
    const recentItems = (recentQuery.data ?? []).map((card, index) => mapCardToRecentItem(card, index));
    const favoriteItems = (favoritesQuery.data ?? []).map(mapCardToMiniItem);
    const wishlistItems = (wishlistQuery.data ?? []).map(mapCardToMiniItem);

    const collectedSetCount = new Set((ownedCardsQuery.data ?? []).map((card) => card.setId)).size;
    const totalSetCount = totalSetsQuery.data ?? 0;
    const setProgress = totalSetCount > 0 ? Math.round((collectedSetCount / totalSetCount) * 100) : 0;

    const stats: DashboardStats = {
      totalCards: { value: formatNumber(state.ownedIds.size) },
      setsCollected: {
        value: `${formatNumber(collectedSetCount)} / ${formatNumber(totalSetCount)}`,
        progress: setProgress,
      },
      favorites: { value: formatNumber(state.favoriteIds.size) },
      wishlist: { value: formatNumber(state.wishlistIds.size) },
    };

    return {
      recentItems,
      favoriteItems,
      wishlistItems,
      stats,
      isRecentLoading: recentQuery.isLoading,
      isFavoritesLoading: favoritesQuery.isLoading,
      isWishlistLoading: wishlistQuery.isLoading,
      isStatsLoading: ownedCardsQuery.isLoading || totalSetsQuery.isLoading,
    };
  }, [
    recentQuery.data,
    favoritesQuery.data,
    wishlistQuery.data,
    ownedCardsQuery.data,
    totalSetsQuery.data,
    recentQuery.isLoading,
    favoritesQuery.isLoading,
    wishlistQuery.isLoading,
    ownedCardsQuery.isLoading,
    totalSetsQuery.isLoading,
    state.ownedIds.size,
    state.favoriteIds.size,
    state.wishlistIds.size,
  ]);
}
