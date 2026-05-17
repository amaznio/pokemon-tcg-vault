'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useQuery } from '@tanstack/react-query';
import type { CardDetail } from '@repo/shared';
import { pokemonApi } from '@/lib/pokemon/api';
import { useLocalCardState } from '@/hooks/use-local-card-state';

export function RecentCardList() {
  const { recentlyViewedIds } = useLocalCardState();
  const ids = recentlyViewedIds.slice(0, 5);

  const query = useQuery({
    queryKey: ['recent.cards', ...ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      const results = await Promise.all(ids.map((id) => pokemonApi.card(id).then((res) => res.data).catch(() => null)));
      return results.filter((card): card is CardDetail => Boolean(card));
    },
  });

  if (!ids.length) return <p className="px-1 text-sm text-muted-foreground">No recent cards yet.</p>;

  return (
    <div className="space-y-2">
      {(query.data ?? []).map((card) => (
        <Link key={card.id} href={`/cards/${card.id}`} className="flex items-center gap-2 rounded-xl px-1 py-1 hover:bg-muted">
          {card.imageSmall ? <img src={card.imageSmall} alt={card.name} className="h-9 w-8 rounded object-cover" /> : <div className="h-9 w-8 rounded bg-muted" />}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{card.name}</p>
            <p className="truncate text-xs text-muted-foreground">{card.setName}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
