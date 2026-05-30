import type { CollectionStats as CollectionStatsModel } from '@/lib/collection/collection-browse';

const statLabels: Array<{ key: keyof CollectionStatsModel; label: string }> = [
  { key: 'uniqueCards', label: 'Unique' },
  { key: 'totalQuantity', label: 'Quantity' },
  { key: 'uniqueSets', label: 'Sets' },
  { key: 'detailedItems', label: 'Detailed' },
];

const formatNumber = (value: number): string => new Intl.NumberFormat().format(value);

export function CollectionStats({ stats }: { stats: CollectionStatsModel }) {
  return (
    <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border/70 bg-muted/20 px-4 py-2.5">
      {statLabels.map((stat) => (
        <div key={stat.key} className="flex min-w-fit items-baseline gap-2">
          <dt className="text-sm font-medium tracking-normal text-muted-foreground">
            {stat.label}
          </dt>
          <dd className="text-base font-semibold tabular-nums tracking-normal">
            {formatNumber(stats[stat.key])}
          </dd>
        </div>
      ))}
    </dl>
  );
}
