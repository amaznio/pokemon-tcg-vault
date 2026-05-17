'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@repo/shared';
import { pokemonApi } from '@/lib/pokemon/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function SetsPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const orderBy = '-releaseDate';
  const pageSize = 10;
  const setsQuery = useQuery({
    queryKey: queryKeys.sets.list(query, page, pageSize, orderBy),
    queryFn: () => pokemonApi.sets(query, page, pageSize, orderBy),
  });

  return (
    <section className="space-y-4">
      <Card><CardHeader><CardTitle>Browse sets</CardTitle></CardHeader><CardContent><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sets" /></CardContent></Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{setsQuery.data?.data.map((set) => <Card key={set.id}><CardContent className="space-y-2 p-4">{set.logo ? <img src={set.logo} alt={set.name} className="h-16 w-full object-contain" /> : null}<h3 className="font-semibold">{set.name}</h3><p className="text-sm text-slate-600">{set.series}</p><Link className="text-sm font-medium text-slate-900 underline" href={`/sets/${set.id}`}>View set</Link></CardContent></Card>)}</div>
      <div className="flex items-center gap-2"><button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button><span className="text-sm">Page {page}</span><button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" onClick={() => setPage((p) => p + 1)}>Next</button></div>
    </section>
  );
}
