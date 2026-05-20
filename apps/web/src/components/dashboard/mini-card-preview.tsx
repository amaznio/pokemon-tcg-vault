import Link from 'next/link';
import type { Route } from 'next';
import { Heart, Bookmark } from 'lucide-react';
import type { MiniCardItem } from '@/lib/dashboard/mock-dashboard-data';
import { cn } from '@/lib/utils';

const DASHBOARD_PREVIEW_SIZE_CLASS: Record<'compact' | 'cardsBaseline', string> = {
  compact: 'w-[128px]',
  cardsBaseline: 'w-[156px]',
};

export function MiniCardPreview({
  item,
  variant,
  size = 'cardsBaseline',
  className,
}: {
  item: MiniCardItem;
  variant: 'favorite' | 'wishlist';
  size?: 'compact' | 'cardsBaseline';
  className?: string;
}) {
  const Icon = variant === 'favorite' ? Heart : Bookmark;

  return (
    <Link
      href={`/cards/${item.id}` as Route}
      className={cn(
        'group block shrink-0 space-y-2',
        DASHBOARD_PREVIEW_SIZE_CLASS[size],
        className,
      )}
    >
      <div className="relative">
        <img
          src={item.image}
          alt={item.name}
          className="aspect-[0.716] w-full rounded-lg object-contain transition-transform group-hover:scale-[1.02]"
        />
        <span className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-background/95 text-primary shadow-sm">
          <Icon className="size-4" />
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="truncate text-base font-semibold leading-tight">{item.name}</p>
        <p className="truncate text-sm text-muted-foreground">{item.setName}</p>
        <p className="truncate text-sm text-muted-foreground">• {item.number}</p>
      </div>
    </Link>
  );
}
