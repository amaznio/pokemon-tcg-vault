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

export type DashboardStat = {
  value: string;
  change?: string;
  progress?: number;
};

export type DashboardStats = {
  totalCards: DashboardStat;
  setsCollected: DashboardStat;
  favorites: DashboardStat;
  wishlist: DashboardStat;
};
