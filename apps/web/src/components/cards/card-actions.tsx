'use client';

import type { MouseEvent } from 'react';
import { Bookmark, CheckCircle2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type CardActionState = {
  isFavorite: boolean;
  isOwned: boolean;
  isWishlisted: boolean;
  onToggleFavorite: () => void;
  onToggleOwned: () => void;
  onToggleWishlist: () => void;
};

export function CardActions({ state }: { state: CardActionState }) {
  const stopClick =
    (handler: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      handler();
    };

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              className={state.isFavorite ? 'text-primary' : 'text-muted-foreground'}
              onClick={stopClick(state.onToggleFavorite)}
              aria-label="Toggle favorite"
            />
          }
        >
          <Heart className={state.isFavorite ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
        </TooltipTrigger>
        <TooltipContent>Add/remove favorite</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              className={state.isOwned ? 'text-primary' : 'text-muted-foreground'}
              onClick={stopClick(state.onToggleOwned)}
              aria-label="Toggle owned"
            />
          }
        >
          <CheckCircle2 className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>Mark owned/unowned</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              className={state.isWishlisted ? 'text-primary' : 'text-muted-foreground'}
              onClick={stopClick(state.onToggleWishlist)}
              aria-label="Toggle wishlist"
            />
          }
        >
          <Bookmark className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>Add/remove wishlist</TooltipContent>
      </Tooltip>
    </div>
  );
}
