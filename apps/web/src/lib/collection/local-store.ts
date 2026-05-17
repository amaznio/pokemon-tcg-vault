'use client';

type StoreState = {
  favorites: string[];
  owned: string[];
  wishlist: string[];
  notes: Record<string, string>;
  recentlyViewed: string[];
};

const KEY = 'ptcg:v2:collection';
const fallback: StoreState = { favorites: [], owned: [], wishlist: [], notes: {}, recentlyViewed: [] };

const read = (): StoreState => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<StoreState>) };
  } catch {
    return fallback;
  }
};

const write = (value: StoreState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(value));
};

export const localCollectionStore = { read, write };
export type { StoreState };
