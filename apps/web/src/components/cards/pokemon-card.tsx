'use client';
import Link from 'next/link';
import { Heart, Library, Eye, Bookmark } from 'lucide-react';
import type { CardSummary } from '@repo/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export type CardActionState = {
  isFavorite: boolean;
  isOwned: boolean;
  isWishlisted: boolean;
  onToggleFavorite: () => void;
  onToggleOwned: () => void;
  onToggleWishlist: () => void;
};

export function CardActions({ state }: { state: CardActionState }) {
  return (
    <div className="absolute right-2 top-2 flex gap-1">
      <Button size="icon" variant={state.isFavorite ? 'default' : 'secondary'} aria-label="Toggle favorite" onClick={state.onToggleFavorite}><Heart className="h-4 w-4" /></Button>
      <Button size="icon" variant={state.isOwned ? 'default' : 'secondary'} aria-label="Toggle owned" onClick={state.onToggleOwned}><Library className="h-4 w-4" /></Button>
      <Button size="icon" variant={state.isWishlisted ? 'default' : 'secondary'} aria-label="Toggle wishlist" onClick={state.onToggleWishlist}><Bookmark className="h-4 w-4" /></Button>
    </div>
  );
}

export function PokemonCard({ card, state }: { card: CardSummary; state: CardActionState }) {
  return (
    <Card className="group overflow-hidden rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="space-y-4 p-4">
        <div className="relative rounded-xl bg-slate-100 p-3">
          <CardActions state={state} />
          {card.imageLarge || card.imageSmall ? (
            <img src={card.imageLarge ?? card.imageSmall ?? ''} alt={card.name} className="mx-auto h-64 w-full object-contain" />
          ) : (
            <div className="grid h-64 place-items-center text-sm text-slate-500">No image</div>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="line-clamp-1 text-base font-semibold">{card.name}</h3>
          <p className="text-sm text-slate-600">{card.setName} • #{card.id.split('-').at(-1) ?? '-'}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {card.rarity ? <Badge variant="outline">{card.rarity}</Badge> : null}
          {card.types.slice(0, 3).map((type) => <Badge key={type}>{type}</Badge>)}
        </div>
        <Link href={`/cards/${card.id}`} className="block"><Button className="w-full"><Eye className="h-4 w-4" />View details</Button></Link>
      </CardContent>
    </Card>
  );
}
