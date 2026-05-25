'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { CardDetail } from '@repo/shared';
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Clock3, ExternalLink, Info, LineChartIcon, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Legend, Line, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

type CardmarketState = NonNullable<CardDetail['cardmarket']>;
type CardmarketPriceGuide = NonNullable<CardmarketState['priceGuide']>;
type CardmarketPriceHistoryPoint = CardmarketState['priceHistory'][number];
type TimeRange = '7D' | '30D' | '90D' | '180D' | '1Y';

type ChartPoint = CardmarketPriceHistoryPoint & {
  date: string;
  timestamp: number;
  dayKey: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

type ChangeResult = {
  absolute: number | null;
  percent: number | null;
};

const timeRanges: Array<{ value: TimeRange; days: number }> = [
  { value: '7D', days: 7 },
  { value: '30D', days: 30 },
  { value: '90D', days: 90 },
  { value: '180D', days: 180 },
  { value: '1Y', days: 365 },
];

const chartConfig = {
  trend: {
    label: 'Market price',
    color: 'hsl(var(--primary))',
  },
  avg7: {
    label: '7D average',
    color: '#8b5cf6',
  },
  low: {
    label: 'Lowest price',
    color: '#7fb3ff',
  },
} satisfies ChartConfig;

const getCardmarketProductUrl = (idProduct: number): string =>
  `https://www.cardmarket.com/Pokemon/Products?idProduct=${idProduct}`;

const formatCurrencyEUR = (value: number | null | undefined): string =>
  typeof value === 'number' && Number.isFinite(value)
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(value)
    : 'n/a';

const formatPercent = (value: number | null | undefined): string =>
  typeof value === 'number' && Number.isFinite(value) ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : 'n/a';

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));

const formatDateTime = (value: string | null | undefined): string =>
  value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'n/a';

const formatCents = (cents: number | null | undefined, currency: string | null | undefined): string => {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return 'n/a';
  const code = currency && currency.trim().length === 3 ? currency : 'EUR';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(cents / 100);
};

const toUtcDayStartTimestamp = (timestamp: number): number => {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const toUtcDayKey = (timestamp: number): string => new Date(toUtcDayStartTimestamp(timestamp)).toISOString();

const average = (values: Array<number | null | undefined>): number | null => {
  const numeric = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!numeric.length) return null;
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
};

const median = (values: Array<number | null | undefined>): number | null => {
  const numeric = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value)).sort((a, b) => a - b);
  if (!numeric.length) return null;
  const middle = Math.floor(numeric.length / 2);
  return numeric.length % 2 ? numeric[middle] ?? null : ((numeric[middle - 1] ?? 0) + (numeric[middle] ?? 0)) / 2;
};

const max = (values: Array<number | null | undefined>): number | null => {
  const numeric = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  return numeric.length ? Math.max(...numeric) : null;
};

const toChartPoints = (history: CardmarketState['priceHistory']): ChartPoint[] =>
  history
    .map((point) => ({
      ...point,
      date: point.snapshotDate,
      timestamp: new Date(point.snapshotDate).getTime(),
      dayKey: toUtcDayKey(new Date(point.snapshotDate).getTime()),
    }))
    .filter((point) => Number.isFinite(point.timestamp))
    .sort((a, b) => a.timestamp - b.timestamp);

const filterByRange = (points: ChartPoint[], range: TimeRange): ChartPoint[] => {
  if (!points.length) return [];
  const days = timeRanges.find((item) => item.value === range)?.days ?? 30;
  const latest = points[points.length - 1]?.timestamp ?? Date.now();
  const earliest = latest - days * 24 * 60 * 60 * 1000;
  return points.filter((point) => point.timestamp >= earliest);
};

const buildDailySeries = (points: ChartPoint[]): ChartPoint[] => {
  if (!points.length) return [];

  const byDay = new Map<string, ChartPoint>();
  for (const point of points) {
    byDay.set(point.dayKey, point);
  }

  const start = toUtcDayStartTimestamp(points[0]?.timestamp ?? Date.now());
  const end = toUtcDayStartTimestamp(points[points.length - 1]?.timestamp ?? Date.now());
  const series: ChartPoint[] = [];

  for (let cursor = start; cursor <= end; cursor += DAY_MS) {
    const dayKey = new Date(cursor).toISOString();
    const existing = byDay.get(dayKey);
    if (existing) {
      series.push(existing);
      continue;
    }

    series.push({
      snapshotDate: dayKey,
      date: dayKey,
      timestamp: cursor,
      dayKey,
      avg: null,
      low: null,
      trend: null,
      avg1: null,
      avg7: null,
      avg30: null,
      avgHolo: null,
      lowHolo: null,
      trendHolo: null,
      avg1Holo: null,
      avg7Holo: null,
      avg30Holo: null,
    });
  }

  return series;
};

const deriveChange = (points: ChartPoint[], days: number): ChangeResult => {
  const latest = [...points].reverse().find((point) => typeof point.trend === 'number');
  if (!latest?.trend) return { absolute: null, percent: null };

  const target = latest.timestamp - days * 24 * 60 * 60 * 1000;
  const previous = [...points]
    .filter((point) => typeof point.trend === 'number' && point.timestamp <= target)
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  if (!previous?.trend) return { absolute: null, percent: null };
  const absolute = latest.trend - previous.trend;
  return { absolute, percent: previous.trend === 0 ? null : (absolute / previous.trend) * 100 };
};

const deriveTrend = (points: ChartPoint[]): { label: string; tone: 'up' | 'down' | 'stable'; percent: number | null; confidence: 'Low' | 'Medium' | 'High' } => {
  const change = deriveChange(points, 30);
  const confidence = points.length >= 30 ? 'High' : points.length >= 7 ? 'Medium' : 'Low';
  if (change.percent === null || Math.abs(change.percent) < 1) {
    return { label: 'Stable', tone: 'stable', percent: change.percent, confidence };
  }
  return change.percent > 0
    ? { label: 'Upward', tone: 'up', percent: change.percent, confidence }
    : { label: 'Downward', tone: 'down', percent: change.percent, confidence };
};

function ChangeBadge({ percent }: { percent: number | null }) {
  if (percent === null) {
    return <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">n/a</span>;
  }

  const positive = percent > 0;
  const stable = Math.abs(percent) < 0.01;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        stable ? 'bg-muted text-muted-foreground' : positive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
      )}
    >
      {stable ? <Minus className="h-3 w-3" /> : positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {formatPercent(percent)}
    </span>
  );
}

function CardmarketEmptyState({ message, compact = false }: { message: string; compact?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center', compact ? 'min-h-[240px]' : 'min-h-[260px]')}>
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-muted">
        <LineChartIcon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">Price history unavailable</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function CardmarketHeader({ cardmarket }: { cardmarket: CardmarketState }) {
  const productId = cardmarket.mapping?.idProduct ?? null;

  return (
    <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border bg-background p-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold tracking-tight">Cardmarket overview</h3>
          <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary hover:bg-primary/10">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Cardmarket match confirmed
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Product ID: {productId ?? 'n/a'}</p>
      </div>
      <div className="flex flex-col items-start gap-2 sm:items-end">
        {productId ? (
          <a
            href={cardmarket.mapping?.finalUrl ?? getCardmarketProductUrl(productId)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            View on Cardmarket
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
        <p className="text-xs text-muted-foreground">Data updates when you import the daily Cardmarket JSON.</p>
      </div>
    </section>
  );
}

function MarketKpiItem({
  label,
  value,
  helper,
  change,
}: {
  label: string;
  value: string;
  helper?: string;
  change?: number | null;
}) {
  return (
    <div className="min-w-0 px-4 py-3 first:pl-0 last:pr-0 lg:border-r lg:last:border-r-0">
      <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        <Info className="h-3 w-3" />
      </div>
      <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-2">
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {change !== undefined ? <ChangeBadge percent={change} /> : null}
      </div>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function MarketKpiStrip({ priceGuide, points }: { priceGuide: CardmarketPriceGuide; points: ChartPoint[] }) {
  const oneDayChange = deriveChange(points, 1);
  const sevenDayChange = deriveChange(points, 7);
  const thirtyDayChange = deriveChange(points, 30);
  const trend = deriveTrend(points);

  return (
    <section className="rounded-2xl border bg-background p-4">
      <div className="grid gap-y-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-y-0">
        <MarketKpiItem label="Market price" value={formatCurrencyEUR(priceGuide.trend)} helper="Compared to previous snapshot" change={oneDayChange.percent} />
        <MarketKpiItem label="Lowest price" value={formatCurrencyEUR(priceGuide.low)} helper="Current price guide" />
        <MarketKpiItem label="7D average" value={formatCurrencyEUR(priceGuide.avg7)} helper="Cardmarket field" change={sevenDayChange.percent} />
        <MarketKpiItem label="30D average" value={formatCurrencyEUR(priceGuide.avg30)} helper="Cardmarket field" change={thirtyDayChange.percent} />
        <div className="min-w-0 px-4 py-3 first:pl-0 last:pr-0">
          <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Market trend
            <Info className="h-3 w-3" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <p className={cn('text-2xl font-semibold tracking-tight', trend.tone === 'up' ? 'text-emerald-600' : trend.tone === 'down' ? 'text-red-600' : 'text-foreground')}>
              {trend.label}
            </p>
            {trend.tone === 'up' ? <TrendingUp className="h-6 w-6 text-emerald-600" /> : trend.tone === 'down' ? <TrendingDown className="h-6 w-6 text-red-600" /> : <Minus className="h-6 w-6 text-muted-foreground" />}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">30D trend</p>
        </div>
      </div>
    </section>
  );
}

function TimeRangeToggle({ value, onChange }: { value: TimeRange; onChange: (value: TimeRange) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {timeRanges.map((range) => (
        <Button
          key={range.value}
          type="button"
          variant={value === range.value ? 'default' : 'outline'}
          size="sm"
          className={cn('h-8 px-3', value === range.value ? 'bg-primary text-primary-foreground' : 'bg-background')}
          onClick={() => onChange(range.value)}
        >
          {range.value}
        </Button>
      ))}
    </div>
  );
}

function PriceHistoryChart({ points }: { points: ChartPoint[] }) {
  const [range, setRange] = useState<TimeRange>('30D');
  const filtered = useMemo(() => filterByRange(points, range), [points, range]);
  const dailySeries = useMemo(() => buildDailySeries(filtered), [filtered]);
  const numericPoints = filtered.filter((point) => typeof point.trend === 'number' || typeof point.low === 'number' || typeof point.avg7 === 'number').length;
  const hasChartData = numericPoints >= 1;
  const showDots = numericPoints <= 7;

  return (
    <Card className={cn('rounded-2xl', hasChartData ? 'min-h-[480px]' : 'min-h-0')}>
      <CardHeader className="flex-col items-start justify-between gap-4 space-y-0 sm:flex-row">
        <div>
          <CardTitle>Price history</CardTitle>
          <p className="text-sm text-muted-foreground">Trend, 7D average, and lowest price from imported snapshots.</p>
        </div>
        <TimeRangeToggle value={range} onChange={setRange} />
      </CardHeader>
      <CardContent>
        {hasChartData ? (
          <ChartContainer config={chartConfig} className="h-[380px] w-full aspect-auto">
            <AreaChart data={dailySeries} margin={{ left: 8, right: 12, top: 12, bottom: 8 }}>
              <defs>
                <linearGradient id="marketGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-trend)" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="var(--color-trend)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 4" />
              <XAxis dataKey="date" tickFormatter={formatDate} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis tickFormatter={(value) => `\u20ac${value}`} tickLine={false} axisLine={false} width={42} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => formatDate(String(label))}
                    formatter={(value, name) => (
                      <div className="flex min-w-36 items-center justify-between gap-4">
                        <span className="text-muted-foreground">{chartConfig[String(name) as keyof typeof chartConfig]?.label ?? name}</span>
                        <span className="font-mono font-medium text-foreground">{formatCurrencyEUR(typeof value === 'number' ? value : null)}</span>
                      </div>
                    )}
                  />
                }
              />
              <Legend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="trend"
                stroke="var(--color-trend)"
                fill="url(#marketGradient)"
                strokeWidth={2.5}
                dot={showDots ? { r: 3, fill: 'var(--color-trend)', stroke: 'hsl(var(--background))', strokeWidth: 1.5 } : false}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="avg7"
                stroke="var(--color-avg7)"
                strokeWidth={2}
                strokeDasharray="6 5"
                dot={showDots ? { r: 3, fill: 'var(--color-avg7)', stroke: 'hsl(var(--background))', strokeWidth: 1.5 } : false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="low"
                stroke="var(--color-low)"
                strokeWidth={2}
                dot={showDots ? { r: 3, fill: 'var(--color-low)', stroke: 'hsl(var(--background))', strokeWidth: 1.5 } : false}
                connectNulls={false}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <CardmarketEmptyState compact message="Import Cardmarket price guide JSON to build a daily chart. Missing days are shown as gaps, and a single snapshot still renders." />
        )}
      </CardContent>
    </Card>
  );
}

function StatItem({ label, value, helper, muted = false }: { label: string; value: string; helper?: string | undefined; muted?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl border bg-background/70 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('mt-2 text-lg font-semibold tabular-nums', muted && 'text-muted-foreground')}>{value}</p>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function StatGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </div>
  );
}

function PriceStatisticsPanel({ priceGuide, points }: { priceGuide: CardmarketPriceGuide; points: ChartPoint[] }) {
  const trendValues = points.map((point) => point.trend);
  const avg90 = average(filterByRange(points, '90D').map((point) => point.trend));
  const avg180 = average(filterByRange(points, '180D').map((point) => point.trend));
  const high = max(trendValues);
  const highPoint = high === null ? null : points.find((point) => point.trend === high);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Price statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <StatGroup title="Current price guide" description="Imported directly from the latest Cardmarket price guide JSON.">
          <StatItem label="Average" value={formatCurrencyEUR(average(trendValues) ?? priceGuide.avg)} />
          <StatItem label="Low" value={formatCurrencyEUR(priceGuide.low)} />
          <StatItem label="1D average" value={formatCurrencyEUR(priceGuide.avg1)} />
          <StatItem label="7D average" value={formatCurrencyEUR(priceGuide.avg7)} />
          <StatItem label="30D average" value={formatCurrencyEUR(priceGuide.avg30)} />
        </StatGroup>
        <StatGroup title="Historical derived" description="Calculated from daily imported snapshots when enough history exists.">
          <StatItem label="Median" value={formatCurrencyEUR(median(trendValues))} muted={median(trendValues) === null} />
          <StatItem label="90D average" value={formatCurrencyEUR(avg90)} muted={avg90 === null} />
          <StatItem label="180D average" value={formatCurrencyEUR(avg180)} muted={avg180 === null} />
          <StatItem label="All-time high" value={formatCurrencyEUR(high)} helper={highPoint ? formatDate(highPoint.date) : undefined} muted={high === null} />
        </StatGroup>
      </CardContent>
    </Card>
  );
}

function PriceChangeCard({ points }: { points: ChartPoint[] }) {
  const rows = [
    { label: '1 Day', change: deriveChange(points, 1) },
    { label: '7 Days', change: deriveChange(points, 7) },
    { label: '30 Days', change: deriveChange(points, 30) },
  ];

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Price change</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-medium">{formatCurrencyEUR(row.change.absolute)}</span>
            <ChangeBadge percent={row.change.percent} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DataAvailabilityCard({ points, priceGuide }: { points: ChartPoint[]; priceGuide: CardmarketPriceGuide }) {
  const availableFields = [priceGuide.trend, priceGuide.low, priceGuide.avg, priceGuide.avg1, priceGuide.avg7, priceGuide.avg30].filter(
    (value) => typeof value === 'number',
  ).length;

  return (
    <div className="space-y-3 text-sm">
      <div>
        <h4 className="text-base font-medium">Data availability</h4>
        <p className="text-xs text-muted-foreground">What this dashboard can currently use.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border bg-background/70 p-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Imported snapshots</span>
            <span className="font-medium">{points.length}</span>
          </div>
        </div>
        <div className="rounded-xl border bg-background/70 p-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Current price fields</span>
            <span className="font-medium">{availableFields}/6</span>
          </div>
        </div>
      </div>
      <p className="rounded-xl bg-muted/40 p-3 leading-relaxed text-muted-foreground">
        Sales volume and live listings are not in the current JSON, so only price guide snapshots are shown.
      </p>
    </div>
  );
}

function MarketInsightCard({ points }: { points: ChartPoint[] }) {
  const trend = deriveTrend(points);
  const confidencePct = trend.confidence === 'High' ? '85%' : trend.confidence === 'Medium' ? '58%' : '32%';
  const Icon = trend.tone === 'up' ? TrendingUp : trend.tone === 'down' ? TrendingDown : Minus;
  const message =
    trend.percent === null
      ? 'More daily snapshots are needed before a reliable market direction can be calculated.'
      : trend.tone === 'up'
        ? `The 30-day market price has increased by ${formatPercent(trend.percent)}.`
        : trend.tone === 'down'
          ? `The 30-day market price has decreased by ${formatPercent(Math.abs(trend.percent))}.`
          : 'Prices are stable across the available 30-day window.';

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
      <div className="flex gap-4">
        <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full', trend.tone === 'up' ? 'bg-emerald-100 text-emerald-700' : trend.tone === 'down' ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground')}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className={cn('font-medium', trend.tone === 'up' ? 'text-emerald-700' : trend.tone === 'down' ? 'text-red-700' : 'text-foreground')}>
            {trend.tone === 'up' ? 'Prices are trending upward' : trend.tone === 'down' ? 'Prices are trending downward' : 'Prices are stable'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
      <div className="space-y-2 border-t pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Confidence</span>
          <span className="font-medium">{trend.confidence}</span>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <div className="h-2 rounded-full bg-primary" style={{ width: confidencePct }} />
        </div>
      </div>
    </div>
  );
}

function DataAndInsightPanel({ points, priceGuide }: { points: ChartPoint[]; priceGuide: CardmarketPriceGuide }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="grid gap-6 py-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <DataAvailabilityCard points={points} priceGuide={priceGuide} />
        <MarketInsightCard points={points} />
      </CardContent>
    </Card>
  );
}

export function CardmarketTab({ card }: { card: CardDetail }) {
  const cardmarket = card.cardmarket;
  const firecrawl = cardmarket?.firecrawlEnrichment;

  if (cardmarket?.enrichmentState === 'matching') {
    return <p className="text-sm text-muted-foreground">Matching Cardmarket pricing...</p>;
  }

  if (cardmarket?.enrichmentState === 'unresolved') {
    return <p className="text-sm text-muted-foreground">No confirmed Cardmarket match yet.</p>;
  }

  if (cardmarket?.enrichmentState === 'error') {
    return <p className="text-sm text-muted-foreground">Cardmarket matching failed. Please retry later.</p>;
  }

  if (cardmarket?.enrichmentState !== 'matched' || !cardmarket.mapping) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{cardmarket?.statusMessage ?? 'Cardmarket matching is not available yet.'}</p>
        {firecrawl ? <FirecrawlEnrichmentBlock enrichment={firecrawl} /> : null}
      </div>
    );
  }

  if (!cardmarket.priceGuide) {
    return (
      <div className="space-y-4">
        <CardmarketHeader cardmarket={cardmarket} />
        <CardmarketEmptyState message="This card is linked, but the linked Cardmarket product does not have imported price guide data yet." />
      </div>
    );
  }

  const points = toChartPoints(cardmarket.priceHistory ?? []);

  return (
    <div className="space-y-5">
      {firecrawl ? <FirecrawlEnrichmentBlock enrichment={firecrawl} /> : null}
      <CardmarketHeader cardmarket={cardmarket} />
      <MarketKpiStrip priceGuide={cardmarket.priceGuide} points={points} />
      <PriceHistoryChart points={points} />
      <PriceStatisticsPanel priceGuide={cardmarket.priceGuide} points={points} />
      <div className="grid gap-5 xl:grid-cols-[minmax(240px,0.7fr)_minmax(0,1.3fr)]">
        <PriceChangeCard points={points} />
        <DataAndInsightPanel points={points} priceGuide={cardmarket.priceGuide} />
      </div>
      <footer className="flex flex-wrap items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
        <Clock3 className="h-3.5 w-3.5" />
        <span>Cardmarket data updates when the daily JSON import runs.</span>
        <span>Last updated: {formatDateTime(cardmarket.priceGuide.updatedAt)}</span>
      </footer>
    </div>
  );
}

function FirecrawlEnrichmentBlock({ enrichment }: { enrichment: NonNullable<NonNullable<CardDetail['cardmarket']>['firecrawlEnrichment']> }) {
  if (enrichment.status === 'pending') {
    return <p className="text-xs text-muted-foreground">Refreshing Cardmarket pricing in the background...</p>;
  }

  if (enrichment.status !== 'success') {
    return (
      <p className="text-xs text-muted-foreground">
        Cardmarket pricing unavailable.
        {enrichment.updatedAt ? ` Last checked: ${formatDateTime(enrichment.updatedAt)}.` : ''}
      </p>
    );
  }

  return (
    <section className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <span>From: {formatCents(enrichment.fromPriceCents, enrichment.currency)}</span>
        <span>Trend: {formatCents(enrichment.priceTrendCents, enrichment.currency)}</span>
        <span>30D avg: {formatCents(enrichment.avgSellPrice30dCents, enrichment.currency)}</span>
        <span>7D avg: {formatCents(enrichment.avgPrice7dCents, enrichment.currency)}</span>
        <span>1D avg: {formatCents(enrichment.avgPrice1dCents, enrichment.currency)}</span>
        <span>Items: {enrichment.availableItems ?? 'n/a'}</span>
      </div>
      <p className="mt-2 text-muted-foreground">
        Cardmarket extraction last updated: {formatDateTime(enrichment.updatedAt)}.
      </p>
    </section>
  );
}
