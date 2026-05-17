'use client';

import { useEffect, useMemo, useState } from 'react';
import { localCollectionStore, type StoreState } from '@/lib/collection/local-store';

const toSet = (values: string[]) => new Set(values);

export function useCollection() {
  const [state, setState] = useState<StoreState>({ favorites: [], owned: [], wishlist: [], notes: {}, recentlyViewed: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(localCollectionStore.read());
    setHydrated(true);
  }, []);

  const persist = (next: StoreState) => {
    setState(next);
    localCollectionStore.write(next);
  };

  return useMemo(() => {
    const favorites = toSet(state.favorites);
    const owned = toSet(state.owned);
    const wishlist = toSet(state.wishlist);
    return {
      hydrated,
      favorites,
      owned,
      wishlist,
      isFavorite: (id: string) => favorites.has(id),
      isOwned: (id: string) => owned.has(id),
      isWishlisted: (id: string) => wishlist.has(id),
      toggleFavorite: (id: string) => {
        const next = new Set(favorites);
        next.has(id) ? next.delete(id) : next.add(id);
        persist({ ...state, favorites: [...next] });
      },
      toggleOwned: (id: string) => {
        const next = new Set(owned);
        next.has(id) ? next.delete(id) : next.add(id);
        persist({ ...state, owned: [...next] });
      },
      toggleWishlist: (id: string) => {
        const next = new Set(wishlist);
        next.has(id) ? next.delete(id) : next.add(id);
        persist({ ...state, wishlist: [...next] });
      },
      setNote: (id: string, note: string) => persist({ ...state, notes: { ...state.notes, [id]: note } }),
      noteFor: (id: string) => state.notes[id] ?? '',
      pushRecentlyViewed: (id: string) => {
        const next = [id, ...state.recentlyViewed.filter((v) => v !== id)].slice(0, 20);
        persist({ ...state, recentlyViewed: next });
      },
      recentlyViewed: state.recentlyViewed,
    };
  }, [state, hydrated]);
}
