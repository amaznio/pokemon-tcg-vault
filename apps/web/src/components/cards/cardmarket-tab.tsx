'use client';

import { useQuery } from '@tanstack/react-query';
import type { CardDefaultPricing, CardDetail, CardPriceSnapshot } from '@repo/shared';
import { Clock3, ExternalLink, LineChartIcon } from 'lucide-react';
import { queryKeys } from '@repo/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { pokemonApi } from '@/lib/pokemon/api';

const formatCents = (cents: number | null | undefined, currency: string | null | undefined): string => {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) return 'n/a';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'EUR' }).format(cents / 100);
};

const formatDateTime = (value: string | null | undefined): string =>
  value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'n/a';

const formatDate = (value: string | null | undefined): string => {
  if (!value) return 'n/a';
  const match = value.match(/^(\d{4})[/-](\d{2})[/-](\d{2})$/);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);

  if (Number.isNaN(date.getTime())) return 'n/a';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
};

type PriceGridData = {
  fromPriceCents: number | null;
  priceTrendCents: number | null;
  avgSellPrice30dCents: number | null;
  avgPrice7dCents: number | null;
  avgPrice1dCents: number | null;
  availableItems?: number | null;
  currency: string | null;
};

type PricingPanelData = {
  title: string;
  badge: string;
  description: string;
  pricingUrl: string | null;
  timestampLabel: string;
  timestamp: string;
  pricing: PriceGridData;
};

function EmptyPricing({ title = 'No pricing yet', message }: { title?: string; message: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
      <div className="mb-4 grid size-11 place-items-center rounded-full bg-muted">
        <LineChartIcon className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function PriceGrid({ pricing }: { pricing: PriceGridData }) {
  const items = [
    { label: 'From', value: formatCents(pricing.fromPriceCents, pricing.currency) },
    { label: 'Trend', value: formatCents(pricing.priceTrendCents, pricing.currency) },
    { label: '30D avg', value: formatCents(pricing.avgSellPrice30dCents, pricing.currency) },
    { label: '7D avg', value: formatCents(pricing.avgPrice7dCents, pricing.currency) },
    { label: '1D avg', value: formatCents(pricing.avgPrice1dCents, pricing.currency) },
    { label: 'Items', value: pricing.availableItems?.toString() ?? 'n/a' },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border bg-background/70 p-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">{item.label}</p>
          <p className="mt-2 text-xl font-semibold tabular-nums">{item.value}</p>
        </div>
      ))}
    </section>
  );
}

function PricingPanel({ data }: { data: PricingPanelData }) {
  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border bg-background p-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight">{data.title}</h3>
            <Badge variant="secondary">{data.badge}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{data.description}</p>
        </div>
        {data.pricingUrl ? (
          <Button variant="outline" size="sm" render={<a href={data.pricingUrl} target="_blank" rel="noreferrer" />}>
            View source
            <ExternalLink />
          </Button>
        ) : null}
      </section>
      <PriceGrid pricing={data.pricing} />
      <footer className="flex flex-wrap items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
        <Clock3 className="size-3.5" />
        <span>
          {data.timestampLabel}: {data.timestamp}
        </span>
      </footer>
    </div>
  );
}

const mapSnapshotToPanelData = (snapshot: CardPriceSnapshot, cardName: string): PricingPanelData => ({
  title: 'Firecrawl pricing',
  badge: 'Cardmarket scrape',
  description: snapshot.productName ?? cardName,
  pricingUrl: snapshot.pricingUrl,
  timestampLabel: 'Last scraped',
  timestamp: formatDateTime(snapshot.fetchedAt),
  pricing: snapshot,
});

const mapDefaultPricingToPanelData = (pricing: CardDefaultPricing, cardName: string): PricingPanelData => ({
  title: 'Cardmarket pricing',
  badge: 'Pokemon TCG API',
  description: cardName,
  pricingUrl: pricing.pricingUrl,
  timestampLabel: 'Last updated',
  timestamp: formatDate(pricing.updatedAt),
  pricing,
});

export function CardmarketTab({ card }: { card: CardDetail }) {
  const pricesQuery = useQuery({
    queryKey: queryKeys.cards.prices(card.id),
    queryFn: () => pokemonApi.cardPrices(card.id).then((response) => response.data),
    retry: false,
  });

  const latestSuccess = pricesQuery.data?.find((snapshot) => snapshot.status === 'success') ?? null;
  if (latestSuccess) {
    return <PricingPanel data={mapSnapshotToPanelData(latestSuccess, card.name)} />;
  }

  if (card.defaultPricing) {
    return <PricingPanel data={mapDefaultPricingToPanelData(card.defaultPricing, card.name)} />;
  }

  if (pricesQuery.isLoading) {
    return <Skeleton className="h-52 rounded-2xl" />;
  }

  if (pricesQuery.isError) {
    return <EmptyPricing message="Sign in and refresh prices from one of your collections to scrape this card with Firecrawl." />;
  }

  const latest = pricesQuery.data?.[0] ?? null;
  if (!latest) {
    return <EmptyPricing message="Add this card to a collection, then refresh that collection's prices." />;
  }

  if (latest.status !== 'success') {
    return (
      <EmptyPricing
        message={
          latest.status === 'missing_url'
            ? 'This card has no Cardmarket URL in the cached Pokemon TCG payload.'
            : latest.lastError ?? `Latest Firecrawl refresh ended with status ${latest.status}.`
        }
      />
    );
  }

  return <PricingPanel data={mapSnapshotToPanelData(latest, card.name)} />;
}
