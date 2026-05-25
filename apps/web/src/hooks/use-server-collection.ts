'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type CollectionKind } from '@repo/shared';
import { pokemonApi } from '@/lib/pokemon/api';

const systemNameByKind: Record<Exclude<CollectionKind, 'binder'>, string> = {
  owned: 'Owned',
  favorites: 'Favorites',
  wishlist: 'Wishlist',
};

export function useServerCollection() {
  const queryClient = useQueryClient();
  const collectionsQuery = useQuery({
    queryKey: queryKeys.collections.list(),
    queryFn: () => pokemonApi.collections().then((response) => response.data),
    retry: false,
  });

  const collectionIds = useMemo(() => {
    const collections = collectionsQuery.data ?? [];
    return {
      owned: collections.find((collection) => collection.kind === 'owned' && collection.name === systemNameByKind.owned)?.id ?? null,
      favorites: collections.find((collection) => collection.kind === 'favorites' && collection.name === systemNameByKind.favorites)?.id ?? null,
      wishlist: collections.find((collection) => collection.kind === 'wishlist' && collection.name === systemNameByKind.wishlist)?.id ?? null,
    };
  }, [collectionsQuery.data]);

  const ownedItemsQuery = useQuery({
    queryKey: queryKeys.collections.items(collectionIds.owned ?? 'none-owned'),
    enabled: Boolean(collectionIds.owned),
    queryFn: () => pokemonApi.collectionItems(collectionIds.owned as string).then((response) => response.data),
  });
  const favoriteItemsQuery = useQuery({
    queryKey: queryKeys.collections.items(collectionIds.favorites ?? 'none-favorites'),
    enabled: Boolean(collectionIds.favorites),
    queryFn: () => pokemonApi.collectionItems(collectionIds.favorites as string).then((response) => response.data),
  });
  const wishlistItemsQuery = useQuery({
    queryKey: queryKeys.collections.items(collectionIds.wishlist ?? 'none-wishlist'),
    enabled: Boolean(collectionIds.wishlist),
    queryFn: () => pokemonApi.collectionItems(collectionIds.wishlist as string).then((response) => response.data),
  });

  const allItems = {
    owned: ownedItemsQuery.data ?? [],
    favorites: favoriteItemsQuery.data ?? [],
    wishlist: wishlistItemsQuery.data ?? [],
  };

  const addMutation = useMutation({
    mutationFn: ({ collectionId, cardId }: { collectionId: string; cardId: string }) =>
      pokemonApi.addCollectionItem(collectionId, { cardId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.collections.list() });
      await queryClient.invalidateQueries({ queryKey: ['collections.items'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ collectionId, itemId }: { collectionId: string; itemId: string }) =>
      pokemonApi.deleteCollectionItem(collectionId, itemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.collections.list() });
      await queryClient.invalidateQueries({ queryKey: ['collections.items'] });
    },
  });

  const toggle = (kind: Exclude<CollectionKind, 'binder'>, cardId: string) => {
    const collectionId = collectionIds[kind];
    if (!collectionId) return;
    const existing = allItems[kind].find((item) => item.cardId === cardId);
    if (existing) deleteMutation.mutate({ collectionId, itemId: existing.id });
    else addMutation.mutate({ collectionId, cardId });
  };

  return {
    collections: collectionsQuery.data ?? [],
    collectionIds,
    favoriteIds: new Set(allItems.favorites.map((item) => item.cardId)),
    ownedIds: new Set(allItems.owned.map((item) => item.cardId)),
    wishlistIds: new Set(allItems.wishlist.map((item) => item.cardId)),
    items: allItems,
    isLoading: collectionsQuery.isLoading || ownedItemsQuery.isLoading || favoriteItemsQuery.isLoading || wishlistItemsQuery.isLoading,
    isFavorite: (id: string) => allItems.favorites.some((item) => item.cardId === id),
    isOwned: (id: string) => allItems.owned.some((item) => item.cardId === id),
    isWishlist: (id: string) => allItems.wishlist.some((item) => item.cardId === id),
    toggleFavorite: (id: string) => toggle('favorites', id),
    toggleOwned: (id: string) => toggle('owned', id),
    toggleWishlist: (id: string) => toggle('wishlist', id),
  };
}
