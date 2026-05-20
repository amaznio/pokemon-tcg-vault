import { BadgeDollarSign, Bookmark, Heart, Layers, ScanSearch } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { StatItem } from '@/components/dashboard/stat-item';
import { dashboardStats } from '@/lib/dashboard/mock-dashboard-data';

export function StatStrip() {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="grid gap-4 xl:grid-cols-[1fr_auto_1.3fr_auto_1fr_auto_1fr_auto_1.2fr] xl:items-center">
        <StatItem label="Total cards" value={dashboardStats.totalCards.value} change={dashboardStats.totalCards.change} icon={<ScanSearch className="size-5 text-primary" />} />
        <Separator orientation="vertical" className="hidden h-16 xl:block" />
        <StatItem
          label="Sets collected"
          value={dashboardStats.setsCollected.value}
          change={dashboardStats.setsCollected.change}
          progress={dashboardStats.setsCollected.progress}
          icon={<Layers className="size-5 text-primary" />}
        />
        <Separator orientation="vertical" className="hidden h-16 xl:block" />
        <StatItem label="Favorites" value={dashboardStats.favorites.value} change={dashboardStats.favorites.change} icon={<Heart className="size-5 text-rose-500" />} />
        <Separator orientation="vertical" className="hidden h-16 xl:block" />
        <StatItem label="Wishlist" value={dashboardStats.wishlist.value} change={dashboardStats.wishlist.change} icon={<Bookmark className="size-5 text-primary" />} />
        <Separator orientation="vertical" className="hidden h-16 xl:block" />
        <StatItem label="Collection value" value={dashboardStats.collectionValue.value} change={dashboardStats.collectionValue.change} icon={<BadgeDollarSign className="size-5 text-emerald-600" />} />
      </div>
    </section>
  );
}
