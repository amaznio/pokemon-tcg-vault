import Link from 'next/link';
import type { Route } from 'next';
import type { RecentCardItem } from '@/lib/dashboard/types';

export function RecentCardList({
  items,
  maxItems,
}: {
  items: RecentCardItem[];
  maxItems?: number;
}) {
  const visibleItems = typeof maxItems === 'number' ? items.slice(0, maxItems) : items;

  return (
    <div className="flex flex-col gap-2 md:gap-4">
      {visibleItems.map((item) => (
        <Link
          key={item.id}
          href={`/cards/${item.id}` as Route}
          className="flex h-[84px] items-center gap-3 rounded-lg p-2 hover:bg-muted/70"
        >
          <img
            src={item.image}
            alt={item.name}
            className="h-[72px] w-[52px] rounded-sm object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold leading-tight">{item.name}</p>
            <p className="truncate text-sm text-muted-foreground leading-relaxed">
              {item.setName} • {item.number}
            </p>
          </div>
          <p className="shrink-0 text-xs text-muted-foreground">{item.viewedAtLabel}</p>
        </Link>
      ))}
    </div>
  );
}
