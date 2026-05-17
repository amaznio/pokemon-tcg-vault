'use client';

import { useEffect, useMemo, useState } from 'react';
import { localCollectionStore, type StoreState } from '@/lib/collection/local-store';

const toSet = (values: string[]) => new Set(values);

export function useLocalCardState() {
  const [state, setState] = useState<StoreState>({ favorites: [], owned: [], wishlist: [], notes: {}, recentlyViewed: [] });

  useEffect(() => {
    setState(localCollectionStore.read());
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
      favoriteIds: favorites,
      ownedIds: owned,
      wishlistIds: wishlist,
      recentlyViewedIds: state.recentlyViewed,
      notes: state.notes,
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
      addRecentlyViewed: (id: string) => {
        const next = [id, ...state.recentlyViewed.filter((value) => value !== id)].slice(0, 12);
        persist({ ...state, recentlyViewed: next });
      },
      pushRecentlyViewed: (id: string) => {
        const next = [id, ...state.recentlyViewed.filter((value) => value !== id)].slice(0, 12);
        persist({ ...state, recentlyViewed: next });
      },
      setNote: (id: string, note: string) => persist({ ...state, notes: { ...state.notes, [id]: note } }),
      noteFor: (id: string) => state.notes[id] ?? '',
      isFavorite: (id: string) => favorites.has(id),
      isOwned: (id: string) => owned.has(id),
      isWishlist: (id: string) => wishlist.has(id),
      isWishlisted: (id: string) => wishlist.has(id),
    };
  }, [state]);
}
