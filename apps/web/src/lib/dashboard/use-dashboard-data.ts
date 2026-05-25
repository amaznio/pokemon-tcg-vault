'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CardSummary } from '@repo/shared';
import { useServerCollection } from '@/hooks/use-server-collection';
import { pokemonApi } from '@/lib/pokemon/api';
import type { DashboardStats, MiniCardItem } from '@/lib/dashboard/types';

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

const mapCardToMiniItem = (card: CardSummary): MiniCardItem => ({
  id: card.id,
  name: card.name,
  setName: card.setName,
  number: card.id.split('-')[1] ?? card.id,
  image: card.imageLarge ?? card.imageSmall ?? '',
});

export function useDashboardData() {
  const collection = useServerCollection();

  const totalSetsQuery = useQuery({
    queryKey: ['dashboard.sets.totalCount'],
    queryFn: async () => {
      const response = await pokemonApi.sets('', 1, 1);
      return response.totalCount;
    },
  });

  return useMemo(() => {
    const favoriteItems = collection.items.favorites.slice(0, 4).map((item) => mapCardToMiniItem(item.card));
    const wishlistItems = collection.items.wishlist.slice(0, 4).map((item) => mapCardToMiniItem(item.card));
    const collectedSetCount = new Set(collection.items.owned.map((item) => item.card.setId)).size;
    const totalSetCount = totalSetsQuery.data ?? 0;
    const setProgress = totalSetCount > 0 ? Math.round((collectedSetCount / totalSetCount) * 100) : 0;

    const stats: DashboardStats = {
      totalCards: { value: formatNumber(collection.ownedIds.size) },
      setsCollected: {
        value: `${formatNumber(collectedSetCount)} / ${formatNumber(totalSetCount)}`,
        progress: setProgress,
      },
      favorites: { value: formatNumber(collection.favoriteIds.size) },
      wishlist: { value: formatNumber(collection.wishlistIds.size) },
    };

    return {
      recentItems: [],
      favoriteItems,
      wishlistItems,
      stats,
      isRecentLoading: false,
      isFavoritesLoading: collection.isLoading,
      isWishlistLoading: collection.isLoading,
      isStatsLoading: collection.isLoading || totalSetsQuery.isLoading,
    };
  }, [collection, totalSetsQuery.data, totalSetsQuery.isLoading]);
}
