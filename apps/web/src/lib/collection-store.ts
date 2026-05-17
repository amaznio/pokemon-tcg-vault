'use client';

import { useEffect, useMemo, useState } from 'react';
import { collectionStorage, type Folder } from './collection-storage';

export const useCollectionStore = () => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderCards, setFolderCards] = useState<{ folderId: string; cardId: string }[]>([]);

  useEffect(() => {
    setFavorites(collectionStorage.getFavorites());
    setFolders(collectionStorage.getFolders());
    setFolderCards(collectionStorage.getFolderCards());
  }, []);

  const persistFavorites = (next: Set<string>) => {
    setFavorites(next);
    collectionStorage.setFavorites(next);
  };

  const persistFolders = (next: Folder[]) => {
    setFolders(next);
    collectionStorage.setFolders(next);
  };

  const persistFolderCards = (next: { folderId: string; cardId: string }[]) => {
    setFolderCards(next);
    collectionStorage.setFolderCards(next);
  };

  return useMemo(
    () => ({
      favorites,
      folders,
      isFavorite: (cardId: string) => favorites.has(cardId),
      toggleFavorite: (cardId: string) => {
        const next = new Set(favorites);
        if (next.has(cardId)) next.delete(cardId);
        else next.add(cardId);
        persistFavorites(next);
      },
      createFolder: (name: string) => {
        const now = new Date().toISOString();
        persistFolders([...folders, { id: crypto.randomUUID(), name, createdAt: now, updatedAt: now }]);
      },
      renameFolder: (id: string, name: string) => {
        persistFolders(folders.map((f) => (f.id === id ? { ...f, name, updatedAt: new Date().toISOString() } : f)));
      },
      deleteFolder: (id: string) => {
        persistFolders(folders.filter((f) => f.id !== id));
        persistFolderCards(folderCards.filter((fc) => fc.folderId !== id));
      },
      folderContains: (folderId: string, cardId: string) =>
        folderCards.some((fc) => fc.folderId === folderId && fc.cardId === cardId),
      addCardToFolder: (folderId: string, cardId: string) => {
        if (folderCards.some((fc) => fc.folderId === folderId && fc.cardId === cardId)) return;
        persistFolderCards([...folderCards, { folderId, cardId }]);
      },
      removeCardFromFolder: (folderId: string, cardId: string) => {
        persistFolderCards(folderCards.filter((fc) => !(fc.folderId === folderId && fc.cardId === cardId)));
      },
      cardsForFolder: (folderId: string) => folderCards.filter((fc) => fc.folderId === folderId).map((fc) => fc.cardId),
    }),
    [favorites, folders, folderCards],
  );
};