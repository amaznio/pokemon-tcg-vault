'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { queryKeys } from '@repo/shared';
import type { CardDetail } from '@repo/shared';
import { apiFetch } from '@/lib/api';
import { useCollectionStore } from '@/lib/collection-store';

export default function CardDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { isFavorite, toggleFavorite, folders, addCardToFolder, removeCardFromFolder, folderContains } =
    useCollectionStore();

  const cardQuery = useQuery({
    queryKey: queryKeys.cards.detail(id),
    queryFn: () => apiFetch<{ data: CardDetail; stale?: boolean }>(`/api/cards/${id}`),
  });

  const card = cardQuery.data?.data;

  if (!card) {
    return <p>Loading...</p>;
  }

  return (
    <section>
      <h1>{card.name}</h1>
      <div className="panel">
        {card.imageLarge ? <img src={card.imageLarge} alt={card.name} width={320} height={450} /> : null}
        <p>Set: {card.setName}</p>
        <button onClick={() => toggleFavorite(card.id)}>
          {isFavorite(card.id) ? 'Remove Favorite' : 'Add Favorite'}
        </button>
      </div>
      <h2>Folders</h2>
      <div className="card-grid">
        {folders.map((folder) => {
          const contains = folderContains(folder.id, card.id);
          return (
            <article key={folder.id} className="panel">
              <h3>{folder.name}</h3>
              <button
                className={contains ? 'secondary' : undefined}
                onClick={() => (contains ? removeCardFromFolder(folder.id, card.id) : addCardToFolder(folder.id, card.id))}
              >
                {contains ? 'Remove from folder' : 'Add to folder'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}