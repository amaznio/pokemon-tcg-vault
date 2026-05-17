'use client';

import { Bookmark, CheckCircle2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="flex items-center gap-1">
      <Button size="icon" variant="ghost" className={state.isFavorite ? 'text-primary' : 'text-muted-foreground'} onClick={state.onToggleFavorite} aria-label="Toggle favorite"><Heart className="h-4 w-4" /></Button>
      <Button size="icon" variant="ghost" className={state.isOwned ? 'text-primary' : 'text-muted-foreground'} onClick={state.onToggleOwned} aria-label="Toggle owned"><CheckCircle2 className="h-4 w-4" /></Button>
      <Button size="icon" variant="ghost" className={state.isWishlisted ? 'text-primary' : 'text-muted-foreground'} onClick={state.onToggleWishlist} aria-label="Toggle wishlist"><Bookmark className="h-4 w-4" /></Button>
    </div>
  );
}
