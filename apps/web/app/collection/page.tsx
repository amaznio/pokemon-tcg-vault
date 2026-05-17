'use client';

import { useState } from 'react';
import { useCollectionStore } from '@/lib/collection-store';

export default function CollectionPage() {
  const { favorites, folders, createFolder, renameFolder, deleteFolder, cardsForFolder } = useCollectionStore();
  const [name, setName] = useState('');

  return (
    <section>
      <h1>My Collection</h1>
      <p>Favorites count: {favorites.size}</p>
      <div className="row" style={{ marginBottom: 16 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New folder name" />
        <button
          onClick={() => {
            if (!name.trim()) return;
            createFolder(name.trim());
            setName('');
          }}
        >
          Create folder
        </button>
      </div>
      <div className="card-grid">
        {folders.map((folder) => (
          <article className="panel" key={folder.id}>
            <h3>{folder.name}</h3>
            <p>Cards: {cardsForFolder(folder.id).length}</p>
            <div className="row">
              <button
                className="secondary"
                onClick={() => {
                  const next = prompt('Rename folder', folder.name);
                  if (next && next.trim()) renameFolder(folder.id, next.trim());
                }}
              >
                Rename
              </button>
              <button className="secondary" onClick={() => deleteFolder(folder.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}