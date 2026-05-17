'use client';
import type { CardSummary } from '@repo/shared';
import { PokemonCard } from '@/components/cards/pokemon-card';
import { Skeleton } from '@/components/ui/skeleton';

export function CardGrid({ cards, loading, emptyMessage, getActionState }: { cards: CardSummary[]; loading?: boolean; emptyMessage: string; getActionState: (cardId: string) => { isFavorite: boolean; isOwned: boolean; isWishlisted: boolean; onToggleFavorite: () => void; onToggleOwned: () => void; onToggleWishlist: () => void } }) {
  if (loading) {
    return <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-[420px]" />)}</div>;
  }
  if (!cards.length) return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">{emptyMessage}</div>;
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">{cards.map((card) => <PokemonCard key={card.id} card={card} state={getActionState(card.id)} />)}</div>;
}
