import Link from 'next/link';
import { ChevronRight, Heart, Layers, PackageCheck, ScanSearch, ShoppingBag } from 'lucide-react';
import type { QuickAction } from '@/lib/dashboard/mock-dashboard-data';
import { cn } from '@/lib/utils';
import { homeSpacing, homeTypography } from '@/components/dashboard/home-styles';

const iconMap = {
  cards: ScanSearch,
  sets: Layers,
  favorites: Heart,
  collection: PackageCheck,
  wishlist: ShoppingBag,
} as const;

export function QuickActionTile({ item }: { item: QuickAction }) {
  const Icon = iconMap[item.icon];

  return (
    <Link
      href={item.href}
      className={cn(
        `group flex items-center ${homeSpacing.group} rounded-2xl border border-border/70 bg-card ${homeSpacing.tilePadding} transition-colors hover:bg-muted/50`,
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={homeTypography.tileTitle}>{item.title}</p>
        <p className={`${homeTypography.body} line-clamp-2`}>{item.description}</p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
