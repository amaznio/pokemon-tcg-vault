import Link from 'next/link';
import type { Route } from 'next';
import type { RecentCardItem } from '@/lib/dashboard/mock-dashboard-data';

export function RecentCardList({ items }: { items: RecentCardItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/cards/${item.id}` as Route}
          className="flex items-center gap-3 rounded-xl px-1.5 py-1.5 hover:bg-muted/70"
        >
          <img
            src={item.image}
            alt={item.name}
            className="h-[54px] w-[39px] rounded-md object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[1.15rem] font-medium leading-tight">{item.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {item.setName} • {item.number}
            </p>
          </div>
          <p className="shrink-0 text-xs text-muted-foreground">{item.viewedAtLabel}</p>
        </Link>
      ))}
    </div>
  );
}
