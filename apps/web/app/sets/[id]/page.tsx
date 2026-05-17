'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { queryKeys } from '@repo/shared';
import { pokemonApi } from '@/lib/pokemon/api';
import { Card, CardContent } from '@/components/ui/card';

export default function SetDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const setQuery = useQuery({ queryKey: queryKeys.sets.detail(id), queryFn: () => pokemonApi.set(id) });
  const cardsQuery = useQuery({ queryKey: queryKeys.cards.list(`set.id:${id}`, 1, 20), queryFn: () => pokemonApi.cards(`set.id:${id}`, 1, 20) });
  const set = setQuery.data?.data;

  if (!set) return <p>Loading...</p>;

  return (
    <section className="space-y-4">
      <Card>
        <CardContent className="space-y-2 p-6">
          {set.logo ? <img src={set.logo} alt={set.name} className="h-20 w-full object-contain" /> : null}
          <h1 className="text-2xl font-semibold">{set.name}</h1>
          <p className="text-slate-600">Series: {set.series ?? 'n/a'}</p>
          <p className="text-slate-600">Release Date: {set.releaseDate ?? 'n/a'}</p>
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cardsQuery.data?.data.map((card) => (
          <Card key={card.id}>
            <CardContent className="space-y-2 p-3">
              {card.imageSmall ? <img src={card.imageSmall} alt={card.name} className="mx-auto h-40 w-full object-contain" /> : null}
              <p className="text-sm font-medium">{card.name}</p>
              <Link href={`/cards/${card.id}`} className="text-xs text-slate-700 underline">View card</Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
