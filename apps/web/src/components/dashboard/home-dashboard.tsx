'use client';

import { Bookmark, Clock3, Heart } from 'lucide-react';
import { HeroBanner } from '@/components/dashboard/hero-banner';
import { QuickActionTile } from '@/components/dashboard/quick-action-tile';
import { DashboardSection } from '@/components/dashboard/dashboard-section';
import { RecentCardList } from '@/components/dashboard/recent-card-list';
import { MiniCardPreviewRow } from '@/components/dashboard/mini-card-preview-row';
import { SectionActionLink } from '@/components/dashboard/section-action-link';
import { StatStrip } from '@/components/dashboard/stat-strip';
import { APP_ROUTES } from '@/lib/routes';
import { homeSpacing } from '@/components/dashboard/home-styles';
import { quickActions } from '@/lib/dashboard/mock-dashboard-data';
import { useDashboardData } from '@/lib/dashboard/use-dashboard-data';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

export function HomeDashboard() {
  const {
    recentItems,
    favoriteItems,
    wishlistItems,
    stats,
    isRecentLoading,
    isFavoritesLoading,
    isWishlistLoading,
    isStatsLoading,
  } = useDashboardData();

  return (
    <div className={homeSpacing.pageStack}>
      <HeroBanner />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {quickActions.map((item) => (
          <QuickActionTile key={item.title} item={item} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <DashboardSection
          title="Recently viewed"
          icon={<Clock3 className="size-5 text-muted-foreground" />}
          action={<SectionActionLink href={APP_ROUTES.cards} label="View all" plain />}
          bottomAction={
            <SectionActionLink
              href={APP_ROUTES.cards}
              label="View all recently viewed"
              fullWidth
            />
          }
        >
          {isRecentLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[84px] rounded-lg" />
              ))}
            </div>
          ) : recentItems.length ? (
            <RecentCardList items={recentItems} maxItems={3} />
          ) : (
            <EmptyState title="No recent cards yet" description="Open a card to populate your history." />
          )}
        </DashboardSection>

        <DashboardSection
          title="Favorite cards"
          icon={<Heart className="size-5 text-muted-foreground" />}
          action={<SectionActionLink href={APP_ROUTES.favorites} label="View all" plain />}
          bottomAction={
            <SectionActionLink
              href={APP_ROUTES.favorites}
              label="View all favorites"
              fullWidth
            />
          }
        >
          {isFavoritesLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[0.716] w-full rounded-xl" />
              ))}
            </div>
          ) : favoriteItems.length ? (
            <MiniCardPreviewRow items={favoriteItems} variant="favorite" />
          ) : (
            <EmptyState title="No favorite cards yet" description="Use the heart action on any card to add favorites." />
          )}
        </DashboardSection>

        <DashboardSection
          title="Wishlist highlights"
          icon={<Bookmark className="size-5 text-muted-foreground" />}
          action={<SectionActionLink href={APP_ROUTES.wishlist} label="View all" plain />}
          bottomAction={
            <SectionActionLink
              href={APP_ROUTES.wishlist}
              label="View all wishlist"
              fullWidth
            />
          }
        >
          {isWishlistLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[0.716] w-full rounded-xl" />
              ))}
            </div>
          ) : wishlistItems.length ? (
            <MiniCardPreviewRow items={wishlistItems} variant="wishlist" />
          ) : (
            <EmptyState title="No wishlist cards yet" description="Use the bookmark action to track cards you want." />
          )}
        </DashboardSection>
      </section>

      <StatStrip stats={stats} loading={isStatsLoading} />
    </div>
  );
}
