'use client';

import Link from 'next/link';
import type { Route } from 'next';
import type { CardSummary } from '@repo/shared';
import { Badge } from '@/components/ui/badge';
import { CardActions, type CardActionState } from '@/components/cards/card-actions';

export function PokemonCardTile({ card, actionState }: { card: CardSummary; actionState: CardActionState }) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3 transition hover:-translate-y-0.5 hover:bg-muted/30 hover:shadow-sm">
      <div className="rounded-xl bg-muted p-2">
        {card.imageLarge || card.imageSmall ? (
          <img src={card.imageLarge ?? card.imageSmall ?? ''} alt={card.name} className="mx-auto h-56 w-full object-contain" />
        ) : (
          <div className="grid h-56 place-items-center text-sm text-muted-foreground">No image</div>
        )}
      </div>
      <div>
        <p className="line-clamp-1 text-base font-semibold">{card.name}</p>
        <p className="text-sm text-muted-foreground">{card.setName} • #{card.id.split('-').at(-1) ?? '-'}</p>
      </div>
      <div className="flex flex-wrap gap-1">
        {card.rarity ? <Badge variant="outline">{card.rarity}</Badge> : null}
        {card.types.slice(0, 2).map((type) => <Badge key={type} variant="secondary">{type}</Badge>)}
      </div>
      <div className="flex items-center justify-between">
        <CardActions state={actionState} />
        <Link href={`/cards/${card.id}`} className="text-sm font-medium text-primary hover:underline">View details</Link>
      </div>
    </div>
  );
}
