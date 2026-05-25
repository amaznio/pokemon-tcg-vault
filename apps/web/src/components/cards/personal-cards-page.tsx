'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { queryKeys, type CollectionKind } from '@repo/shared';
import { CardGrid } from '@/components/cards/card-grid';
import { useServerCollection } from '@/hooks/use-server-collection';
import { pokemonApi } from '@/lib/pokemon/api';
import { SectionHeading } from '@/components/shared/section-heading';
import { Button } from '@/components/ui/button';

const modeMeta: Record<'favorites' | 'owned' | 'wishlist', { title: string; subtitle: string; kind: CollectionKind }> = {
  favorites: { title: 'Favorites', subtitle: 'Cards you marked as favorites.', kind: 'favorites' },
  owned: { title: 'Collection', subtitle: 'Cards you own in your collection.', kind: 'owned' },
  wishlist: { title: 'Wishlist', subtitle: 'Cards you want to collect.', kind: 'wishlist' },
};

export function PersonalCardsPage({ mode }: { mode: 'favorites' | 'owned' | 'wishlist' }) {
  const queryClient = useQueryClient();
  const state = useServerCollection();
  const meta = modeMeta[mode];
  const collectionId = state.collectionIds[meta.kind as 'favorites' | 'owned' | 'wishlist'];

  const itemsQuery = useQuery({
    queryKey: queryKeys.collections.items(collectionId ?? `missing-${mode}`),
    enabled: Boolean(collectionId),
    queryFn: () => pokemonApi.collectionItems(collectionId as string).then((response) => response.data),
  });

  const refreshMutation = useMutation({
    mutationFn: () => pokemonApi.refreshCollectionPrices(collectionId as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.collections.items(collectionId as string) });
    },
  });

  const cards = (itemsQuery.data ?? []).map((item) => item.card);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeading title={meta.title} subtitle={meta.subtitle} />
        {collectionId ? (
          <Button variant="outline" className="rounded-xl" onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending || cards.length === 0}>
            <RefreshCw />
            Refresh prices
          </Button>
        ) : null}
      </div>
      <CardGrid
        cards={cards}
        loading={itemsQuery.isLoading || state.isLoading}
        emptyMessage={`No cards in ${meta.title.toLowerCase()} yet`}
        getActionState={(id) => ({
          isFavorite: state.isFavorite(id),
          isOwned: state.isOwned(id),
          isWishlisted: state.isWishlist(id),
          onToggleFavorite: () => state.toggleFavorite(id),
          onToggleOwned: () => state.toggleOwned(id),
          onToggleWishlist: () => state.toggleWishlist(id),
        })}
      />
    </section>
  );
}
