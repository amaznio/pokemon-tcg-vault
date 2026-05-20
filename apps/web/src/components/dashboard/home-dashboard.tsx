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
import {
  favoriteCards,
  quickActions,
  recentCards,
  wishlistCards,
} from '@/lib/dashboard/mock-dashboard-data';

export function HomeDashboard() {
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
          <RecentCardList items={recentCards} />
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
          <MiniCardPreviewRow items={favoriteCards} variant="favorite" />
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
          <MiniCardPreviewRow items={wishlistCards} variant="wishlist" />
        </DashboardSection>
      </section>

      <StatStrip />
    </div>
  );
}
