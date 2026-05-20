import Link from 'next/link';
import type { Route } from 'next';
import type { RecentCardItem } from '@/lib/dashboard/mock-dashboard-data';
import { homeTypography } from '@/components/dashboard/home-styles';

export function RecentCardList({ items }: { items: RecentCardItem[] }) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/cards/${item.id}` as Route}
          className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/70"
        >
          <img
            src={item.image}
            alt={item.name}
            className="h-[54px] w-[39px] rounded-md object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold leading-tight">{item.name}</p>
            <p className={homeTypography.body}>
              {item.setName} • {item.number}
            </p>
          </div>
          <p className={homeTypography.meta}>{item.viewedAtLabel}</p>
        </Link>
      ))}
    </div>
  );
}
