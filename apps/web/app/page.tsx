'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CardSummary, PaginatedResponse } from '@repo/shared';
import { queryKeys } from '@repo/shared';
import { apiFetch } from '@/lib/api';

export default function CardsPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const cardsQuery = useQuery({
    queryKey: queryKeys.cards.list(query, page, 20),
    queryFn: () =>
      apiFetch<PaginatedResponse<CardSummary>>(
        `/api/cards?query=${encodeURIComponent(query)}&page=${page}&pageSize=20`,
      ),
  });

  return (
    <section>
      <h1>Cards</h1>
      <div className="row" style={{ marginBottom: 16 }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cards" />
        <button className="secondary" onClick={() => setPage(1)}>Search</button>
      </div>
      {cardsQuery.isLoading ? <p>Loading...</p> : null}
      {cardsQuery.data?.stale ? <p>Showing stale cache while upstream is unavailable.</p> : null}
      <div className="card-grid">
        {cardsQuery.data?.data.map((card) => (
          <article key={card.id} className="panel">
            {card.imageSmall ? <img src={card.imageSmall} alt={card.name} width={180} height={250} /> : null}
            <h3>{card.name}</h3>
            <p>{card.setName}</p>
            <Link href={`/cards/${card.id}`}>View</Link>
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