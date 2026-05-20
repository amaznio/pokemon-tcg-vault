import Link from 'next/link';
import type { Route } from 'next';
import { Heart, Bookmark } from 'lucide-react';
import type { MiniCardItem } from '@/lib/dashboard/mock-dashboard-data';
import { cn } from '@/lib/utils';
import { homeTypography } from '@/components/dashboard/home-styles';

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
          className="aspect-[0.716] w-full rounded-xl object-contain transition-transform group-hover:scale-[1.02]"
        />
        <span className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-background text-primary shadow-sm">
          <Icon className="size-4" />
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <p className={cn('truncate leading-tight', homeTypography.tileTitle)}>{item.name}</p>
        <p className={cn('truncate', homeTypography.body)}>{item.setName}</p>
        <p className={cn('truncate', homeTypography.body)}>• {item.number}</p>
      </div>
    </Link>
  );
}
