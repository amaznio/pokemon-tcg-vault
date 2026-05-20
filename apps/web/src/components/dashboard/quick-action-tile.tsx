import Link from 'next/link';
import { ChevronRight, Heart, Layers, PackageCheck, ScanSearch, ShoppingBag } from 'lucide-react';
import type { QuickAction } from '@/lib/dashboard/mock-dashboard-data';
import { cn } from '@/lib/utils';

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
        'group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:bg-accent/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{item.title}</p>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </div>
      <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
