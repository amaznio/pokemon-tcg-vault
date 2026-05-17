'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { queryKeys } from '@repo/shared';
import { CardDetailView } from '@/components/cards/card-detail';
import { pokemonApi } from '@/lib/pokemon/api';
import { useCollection } from '@/hooks/use-collection';

export default function CardDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const collection = useCollection();

  const cardQuery = useQuery({
    queryKey: queryKeys.cards.detail(id),
    queryFn: () => pokemonApi.card(id),
  });

  useEffect(() => {
    if (cardQuery.data?.data.id) collection.pushRecentlyViewed(cardQuery.data.data.id);
  }, [cardQuery.data?.data.id]);

  if (cardQuery.isLoading || !cardQuery.data?.data) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">Loading card...</div>;
  }

  const card = cardQuery.data.data;
  return (
    <CardDetailView
      card={card}
      actions={{
        isFavorite: collection.isFavorite(card.id),
        isOwned: collection.isOwned(card.id),
        isWishlisted: collection.isWishlisted(card.id),
        toggleFavorite: () => collection.toggleFavorite(card.id),
        toggleOwned: () => collection.toggleOwned(card.id),
        toggleWishlist: () => collection.toggleWishlist(card.id),
        note: collection.noteFor(card.id),
        setNote: (note) => collection.setNote(card.id, note),
      }}
    />
  );
}
