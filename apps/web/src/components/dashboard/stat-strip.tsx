import { Bookmark, Heart, Layers, ScanSearch } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { StatItem } from '@/components/dashboard/stat-item';
import type { DashboardStats } from '@/lib/dashboard/types';

export function StatStrip({ stats, loading = false }: { stats: DashboardStats; loading?: boolean }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card p-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_auto_1.3fr_auto_1fr_auto_1fr] xl:items-center">
        <StatItem
          label="Total cards"
          value={stats.totalCards.value}
          {...(stats.totalCards.change ? { change: stats.totalCards.change } : {})}
          reserveProgressSlot
          loading={loading}
          icon={<ScanSearch className="size-5 text-primary" />}
        />
        <Separator orientation="vertical" className="hidden h-16 xl:block" />
        <StatItem
          label="Sets collected"
          value={stats.setsCollected.value}
          {...(stats.setsCollected.change ? { change: stats.setsCollected.change } : {})}
          {...(typeof stats.setsCollected.progress === 'number' ? { progress: stats.setsCollected.progress } : {})}
          reserveProgressSlot
          loading={loading}
          icon={<Layers className="size-5 text-primary" />}
        />
        <Separator orientation="vertical" className="hidden h-16 xl:block" />
        <StatItem
          label="Favorites"
          value={stats.favorites.value}
          {...(stats.favorites.change ? { change: stats.favorites.change } : {})}
          reserveProgressSlot
          loading={loading}
          icon={<Heart className="size-5 text-primary" />}
        />
        <Separator orientation="vertical" className="hidden h-16 xl:block" />
        <StatItem
          label="Wishlist"
          value={stats.wishlist.value}
          {...(stats.wishlist.change ? { change: stats.wishlist.change } : {})}
          reserveProgressSlot
          loading={loading}
          icon={<Bookmark className="size-5 text-primary" />}
        />
      </div>
    </section>
  );
}
