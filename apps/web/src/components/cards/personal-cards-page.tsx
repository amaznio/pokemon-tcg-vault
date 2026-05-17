'use client';

import { useQuery } from '@tanstack/react-query';
import type { CardDetail } from '@repo/shared';
import { CardGrid } from '@/components/cards/card-grid';
import { useLocalCardState } from '@/hooks/use-local-card-state';
import { pokemonApi } from '@/lib/pokemon/api';
import { SectionHeading } from '@/components/shared/section-heading';

function useCardsByIds(ids: string[]) {
  return useQuery({
    queryKey: ['cards.byIds', ...ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const results = await Promise.all(ids.map((id) => pokemonApi.card(id).then((res) => res.data).catch(() => null)));
      return results.filter((value): value is CardDetail => Boolean(value));
    },
  });
}

export function PersonalCardsPage({ mode }: { mode: 'favorites' | 'owned' | 'wishlist' }) {
  const state = useLocalCardState();
  const ids = mode === 'favorites' ? [...state.favoriteIds] : mode === 'owned' ? [...state.ownedIds] : [...state.wishlistIds];
  const cardsQuery = useCardsByIds(ids);
  const title = mode === 'favorites' ? 'Favorites' : mode === 'owned' ? 'Collection' : 'Wishlist';
  const subtitle = mode === 'favorites' ? 'Cards you marked as favorites.' : mode === 'owned' ? 'Cards you own in your collection.' : 'Cards you want to collect.';

  return (
    <section className="space-y-4">
      <SectionHeading title={title} subtitle={subtitle} />
      <CardGrid
        cards={cardsQuery.data ?? []}
        loading={cardsQuery.isLoading}
        emptyMessage={`No cards in ${title.toLowerCase()} yet`}
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
