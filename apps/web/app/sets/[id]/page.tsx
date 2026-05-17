'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import type { SetDetail } from '@repo/shared';
import { queryKeys } from '@repo/shared';
import { apiFetch } from '@/lib/api';

export default function SetDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const setQuery = useQuery({
    queryKey: queryKeys.sets.detail(id),
    queryFn: () => apiFetch<{ data: SetDetail; stale?: boolean }>(`/api/sets/${id}`),
  });

  const set = setQuery.data?.data;
  if (!set) return <p>Loading...</p>;

  return (
    <section>
      <h1>{set.name}</h1>
      <div className="panel">
        {set.logo ? <img src={set.logo} alt={set.name} width={300} height={120} /> : null}
        <p>Series: {set.series}</p>
        <p>Release Date: {set.releaseDate ?? 'n/a'}</p>
      </div>
    </section>
  );
}