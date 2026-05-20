import type { Route } from 'next';
import { APP_ROUTES } from '@/lib/routes';

export type QuickAction = {
  title: string;
  description: string;
  href: Route;
  icon: 'cards' | 'sets' | 'favorites' | 'collection' | 'wishlist';
};

export const quickActions: QuickAction[] = [
  { title: 'Browse cards', description: 'Explore the full card library', href: APP_ROUTES.cards, icon: 'cards' },
  { title: 'Browse sets', description: 'Discover all expansions', href: APP_ROUTES.sets, icon: 'sets' },
  { title: 'Favorites', description: 'View your favorite cards', href: APP_ROUTES.favorites, icon: 'favorites' },
  { title: 'Collection', description: 'See your owned cards', href: APP_ROUTES.collection, icon: 'collection' },
  { title: 'Wishlist', description: 'Track cards you want', href: APP_ROUTES.wishlist, icon: 'wishlist' },
];
