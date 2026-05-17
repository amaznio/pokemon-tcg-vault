'use client';

import type { CardSummary } from '@repo/shared';
import { PokemonCardTile } from '@/components/cards/pokemon-card-tile';
import type { CardActionState } from '@/components/cards/card-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';

export function CardGrid({ cards, loading, getActionState, emptyMessage }: { cards: CardSummary[]; loading?: boolean; getActionState: (id: string) => CardActionState; emptyMessage: string }) {
  if (loading) {
    return <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-[370px] rounded-xl" />)}</div>;
  }

  if (!cards.length) {
    return <EmptyState title={emptyMessage} description="Try adjusting search terms or filters." />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {cards.map((card) => <PokemonCardTile key={card.id} card={card} actionState={getActionState(card.id)} />)}
    </div>
  );
}
