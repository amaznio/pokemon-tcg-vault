'use client';
import { useQuery } from '@tanstack/react-query';
import type { CardDetail } from '@repo/shared';
import { CardGrid } from '@/components/cards/card-grid';
import { useCollection } from '@/hooks/use-collection';
import { pokemonApi } from '@/lib/pokemon/api';

function useCardsByIds(ids: string[]) {
  return useQuery({
    queryKey: ['cards.byIds', ...ids],
    queryFn: async () => {
      const results = await Promise.all(ids.map((id) => pokemonApi.card(id).then((res) => res.data).catch(() => null)));
      return results.filter((v): v is CardDetail => Boolean(v));
    },
    enabled: ids.length > 0,
  });
}

export function PersonalCardsPage({ mode }: { mode: 'favorites' | 'owned' | 'wishlist' }) {
  const collection = useCollection();
  const ids = mode === 'favorites' ? [...collection.favorites] : mode === 'owned' ? [...collection.owned] : [...collection.wishlist];
  const cardsQuery = useCardsByIds(ids);
  const title = mode === 'favorites' ? 'Favorites' : mode === 'owned' ? 'Collection' : 'Wishlist';
  const empty = mode === 'favorites' ? 'No favorites yet' : mode === 'owned' ? 'No cards in your collection yet' : 'No cards in your wishlist yet';

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <CardGrid
        cards={cardsQuery.data ?? []}
        loading={cardsQuery.isLoading}
        emptyMessage={empty}
        getActionState={(cardId) => ({
          isFavorite: collection.isFavorite(cardId),
          isOwned: collection.isOwned(cardId),
          isWishlisted: collection.isWishlisted(cardId),
          onToggleFavorite: () => collection.toggleFavorite(cardId),
          onToggleOwned: () => collection.toggleOwned(cardId),
          onToggleWishlist: () => collection.toggleWishlist(cardId),
        })}
      />
    </section>
  );
}
