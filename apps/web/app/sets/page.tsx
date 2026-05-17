'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PaginatedResponse, SetSummary } from '@repo/shared';
import { queryKeys } from '@repo/shared';
import { apiFetch } from '@/lib/api';

export default function SetsPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const setsQuery = useQuery({
    queryKey: queryKeys.sets.list(query, page, 20),
    queryFn: () =>
      apiFetch<PaginatedResponse<SetSummary>>(
        `/api/sets?query=${encodeURIComponent(query)}&page=${page}&pageSize=20`,
      ),
  });

  return (
    <section>
      <h1>Sets</h1>
      <div className="row" style={{ marginBottom: 16 }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sets" />
        <button className="secondary" onClick={() => setPage(1)}>Search</button>
      </div>
      <div className="card-grid">
        {setsQuery.data?.data.map((set) => (
          <article key={set.id} className="panel">
            {set.logo ? <img src={set.logo} alt={set.name} width={180} height={80} /> : null}
            <h3>{set.name}</h3>
            <p>{set.series}</p>
            <Link href={`/sets/${set.id}`}>View</Link>
          </article>
        ))}
      </div>
      <div className="row" style={{ marginTop: 16 }}>
        <button className="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page}</span>
        <button className="secondary" onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </section>
  );
}