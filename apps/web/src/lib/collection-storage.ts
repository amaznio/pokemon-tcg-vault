'use client';

type Folder = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type FolderCard = {
  folderId: string;
  cardId: string;
};

const FAVORITES_KEY = 'ptcg:v1:favorites';
const FOLDERS_KEY = 'ptcg:v1:folders';
const FOLDER_CARDS_KEY = 'ptcg:v1:folderCards';

const safeParse = <T,>(value: string | null, fallback: T): T => {
  try {
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const collectionStorage = {
  getFavorites(): Set<string> {
    const parsed = safeParse<string[]>(localStorage.getItem(FAVORITES_KEY), []);
    return new Set(parsed);
  },
  setFavorites(favorites: Set<string>): void {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
  },
  getFolders(): Folder[] {
    return safeParse<Folder[]>(localStorage.getItem(FOLDERS_KEY), []);
  },
  setFolders(folders: Folder[]): void {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  },
  getFolderCards(): FolderCard[] {
    return safeParse<FolderCard[]>(localStorage.getItem(FOLDER_CARDS_KEY), []);
  },
  setFolderCards(folderCards: FolderCard[]): void {
    localStorage.setItem(FOLDER_CARDS_KEY, JSON.stringify(folderCards));
  },
};

export type { Folder, FolderCard };