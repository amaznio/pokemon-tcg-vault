import type { Route } from 'next';
import { APP_ROUTES } from '@/lib/routes';

export type QuickAction = {
  title: string;
  description: string;
  href: Route;
  icon: 'cards' | 'sets' | 'favorites' | 'collection' | 'wishlist';
};

export type RecentCardItem = {
  id: string;
  name: string;
  setName: string;
  number: string;
  image: string;
  viewedAtLabel: string;
};

export type MiniCardItem = {
  id: string;
  name: string;
  setName: string;
  number: string;
  image: string;
};

export const quickActions: QuickAction[] = [
  { title: 'Browse cards', description: 'Explore thousands of cards', href: APP_ROUTES.cards, icon: 'cards' },
  { title: 'Browse sets', description: 'Discover all expansions', href: APP_ROUTES.sets, icon: 'sets' },
  { title: 'Favorites', description: 'View your favorite cards', href: APP_ROUTES.favorites, icon: 'favorites' },
  { title: 'Collection', description: 'See your owned cards', href: APP_ROUTES.collection, icon: 'collection' },
  { title: 'Wishlist', description: 'Track cards you want', href: APP_ROUTES.wishlist, icon: 'wishlist' },
];

export const recentCards: RecentCardItem[] = [
  { id: 'sv3-125', name: 'Charizard ex', setName: 'Obsidian Flames', number: '215', image: 'https://images.pokemontcg.io/sv3/125.png', viewedAtLabel: 'Just now' },
  { id: 'base1-58', name: 'Pikachu', setName: 'Base Set', number: '58/102', image: 'https://images.pokemontcg.io/base1/58.png', viewedAtLabel: '2h ago' },
  { id: 'swsh7-95', name: 'Umbreon VMAX', setName: 'Evolving Skies', number: '215', image: 'https://images.pokemontcg.io/swsh7/95.png', viewedAtLabel: '1d ago' },
  { id: 'xy10-45', name: 'Gengar', setName: 'Fossil', number: '5/62', image: 'https://images.pokemontcg.io/xy10/45.png', viewedAtLabel: '2d ago' },
];

export const favoriteCards: MiniCardItem[] = [
  { id: 'swsh9-31', name: 'Mewtwo V', setName: 'Brilliant Stars', number: '31', image: 'https://images.pokemontcg.io/swsh9/31_hires.png' },
  { id: 'swsh12-186', name: 'Lugia V', setName: 'Silver Tempest', number: '186', image: 'https://images.pokemontcg.io/swsh12/186_hires.png' },
  { id: 'swsh11-186', name: 'Giratina V', setName: 'Lost Origin', number: '186', image: 'https://images.pokemontcg.io/swsh11/186_hires.png' },
  { id: 'swsh9-122', name: 'Arceus V', setName: 'Brilliant Stars', number: '122', image: 'https://images.pokemontcg.io/swsh9/122_hires.png' },
];

export const wishlistCards: MiniCardItem[] = [
  { id: 'swsh8-270', name: 'Espeon VMAX', setName: 'Fusion Strike', number: '270', image: 'https://images.pokemontcg.io/swsh8/270_hires.png' },
  { id: 'swsh7-194', name: 'Rayquaza V', setName: 'Evolving Skies', number: '194', image: 'https://images.pokemontcg.io/swsh7/194_hires.png' },
  { id: 'sm35-13', name: 'Moonbreon', setName: 'Neo Discovery', number: '13', image: 'https://images.pokemontcg.io/sm35/13_hires.png' },
  { id: 'smp-SM50', name: 'Gold Pikachu', setName: 'Celebrations', number: '24', image: 'https://images.pokemontcg.io/smp/SM50_hires.png' },
];

export const dashboardStats = {
  totalCards: { value: '1,248', change: '+42 this week' },
  setsCollected: { value: '32 / 122', change: '26% complete', progress: 26 },
  favorites: { value: '128', change: '+12 this week' },
  wishlist: { value: '267', change: '+18 this week' },
  collectionValue: { value: '$3,420.50', change: '+8.2% this month' },
};
