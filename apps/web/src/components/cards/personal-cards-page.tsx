'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { queryKeys, type CollectionKind } from '@repo/shared';
import { CardGrid } from '@/components/cards/card-grid';
import { CollectionControls } from '@/components/collection/collection-controls';
import { CollectionStats } from '@/components/collection/collection-stats';
import { useCollectionBrowseState } from '@/hooks/use-collection-browse-state';
import { useFilteredCollectionItems } from '@/hooks/use-filtered-collection-items';
import { useServerCollection } from '@/hooks/use-server-collection';
import { pokemonApi } from '@/lib/pokemon/api';
import { SectionHeading } from '@/components/shared/section-heading';
import { Button } from '@/components/ui/button';

const modeMeta: Record<
  'favorites' | 'owned' | 'wishlist',
  { title: string; subtitle: string; kind: CollectionKind }
> = {
  favorites: { title: 'Favorites', subtitle: 'Cards you marked as favorites.', kind: 'favorites' },
  owned: { title: 'Collection', subtitle: 'Cards you own in your collection.', kind: 'owned' },
  wishlist: { title: 'Wishlist', subtitle: 'Cards you want to collect.', kind: 'wishlist' },
};

export function PersonalCardsPage({ mode }: { mode: 'favorites' | 'owned' | 'wishlist' }) {
  const queryClient = useQueryClient();
  const state = useServerCollection();
  const meta = modeMeta[mode];
  const collectionId = state.collectionIds[meta.kind as 'favorites' | 'owned' | 'wishlist'];
  const browseState = useCollectionBrowseState();

  const itemsQuery = useQuery({
    queryKey: queryKeys.collections.items(collectionId ?? `missing-${mode}`),
    enabled: Boolean(collectionId),
    queryFn: () =>
      pokemonApi.collectionItems(collectionId as string).then((response) => response.data),
  });

  const refreshMutation = useMutation({
    mutationFn: () => pokemonApi.refreshCollectionPrices(collectionId as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.collections.items(collectionId as string),
      });
    },
  });

  const items = itemsQuery.data ?? [];
  const browse = useFilteredCollectionItems(items, browseState.state);
  const cards = browse.items.map((item) => item.card);
  const isLoading = itemsQuery.isLoading || state.isLoading;
  const hasCollectionItems = items.length > 0;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeading title={meta.title} subtitle={meta.subtitle} />
        {collectionId ? (
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending || items.length === 0}
          >
            <RefreshCw data-icon="inline-start" />
            Refresh prices
          </Button>
        ) : null}
      </div>
      {hasCollectionItems ? (
        <>
          <CollectionStats stats={browse.stats} />
          <CollectionControls
            value={browseState.state}
            options={browse.options}
            activeFilterCount={browseState.activeFilterCount}
            onChange={browseState.setState}
            onReset={browseState.reset}
          />
          <div className="text-sm text-muted-foreground">
            Showing {cards.length} of {items.length} cards
          </div>
        </>
      ) : null}
      <CardGrid
        cards={cards}
        loading={isLoading}
        emptyMessage={
          hasCollectionItems ? 'No matching cards' : `No cards in ${meta.title.toLowerCase()} yet`
        }
        emptyDescription={
          hasCollectionItems
            ? 'Clear search or filters to see more of your collection.'
            : 'Add cards from the card browser to start building this collection.'
        }
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
