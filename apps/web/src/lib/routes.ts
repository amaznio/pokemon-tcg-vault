import type { Route } from 'next';

export const APP_ROUTES = {
  home: '/',
  cards: '/cards',
  sets: '/sets',
  linkage: '/linkage',
  linkageProducts: '/linkage/products',
  favorites: '/favorites',
  collection: '/collection',
  wishlist: '/wishlist',
} as const satisfies Record<string, Route>;

export const MAIN_NAV_ITEMS = [
  { href: APP_ROUTES.cards, label: 'Cards' },
  { href: APP_ROUTES.sets, label: 'Sets' },
  { href: APP_ROUTES.linkage, label: 'Linkage' },
  { href: APP_ROUTES.linkageProducts, label: 'CM Products' },
  { href: APP_ROUTES.favorites, label: 'Favorites' },
  { href: APP_ROUTES.collection, label: 'Collection' },
  { href: APP_ROUTES.wishlist, label: 'Wishlist' },
] as const;
