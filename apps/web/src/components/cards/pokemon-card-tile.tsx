'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import type { CardSummary } from '@repo/shared';
import { Badge } from '@/components/ui/badge';
import { CardActions, type CardActionState } from '@/components/cards/card-actions';
import { CardTiltFrame } from '@/components/cards/card-tilt-frame';

export function PokemonCardTile({
  card,
  actionState,
  useLargeImages,
}: {
  card: CardSummary;
  actionState: CardActionState;
  useLargeImages: boolean;
}) {
  const router = useRouter();
  const href = `/cards/${card.id}` as Route;
  const imageUrl = useLargeImages
    ? (card.imageLarge ?? card.imageSmall ?? '')
    : (card.imageSmall ?? card.imageLarge ?? '');

  return (
    <article
      className="flex h-full cursor-pointer flex-col gap-3 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      onClick={() => router.push(href)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          router.push(href);
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`Open details for ${card.name}`}
    >
      <CardTiltFrame className="mx-auto w-full max-w-[280px]">
        {card.imageSmall || card.imageLarge ? (
          <img src={imageUrl} alt={card.name} className="mx-auto h-72 w-full object-contain" />
        ) : (
          <div className="grid h-72 place-items-center text-sm text-muted-foreground">No image</div>
        )}
      </CardTiltFrame>
      <div className="mx-auto flex w-full max-w-[280px] flex-1 flex-col gap-2 px-2.5 md:gap-3 md:px-4">
        <div className="space-y-0.5">
          <p className="line-clamp-1 text-base font-semibold">{card.name}</p>
          <p className="text-sm text-muted-foreground">{card.setName} • #{card.id.split('-').at(-1) ?? '-'}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {card.rarity ? <Badge variant="outline">{card.rarity}</Badge> : null}
        </div>
        <div className="mt-auto flex items-center justify-between">
          <CardActions state={actionState} />
          <Link
            href={href}
            className="hidden text-sm font-medium text-primary hover:underline md:inline"
            onClick={(event) => event.stopPropagation()}
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
