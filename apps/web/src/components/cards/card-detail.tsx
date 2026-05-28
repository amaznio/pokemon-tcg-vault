'use client';
import type { CardDetail } from '@repo/shared';
import { Bookmark, Heart, Library } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardmarketTab } from '@/components/cards/cardmarket-tab';
import { CardTiltFrame } from '@/components/cards/card-tilt-frame';

type CardDetailActions = {
  isFavorite: boolean;
  isOwned: boolean;
  isWishlisted: boolean;
  toggleFavorite: () => void;
  toggleOwned: () => void;
  toggleWishlist: () => void;
  note: string;
  setNote: (v: string) => void;
};

type CardDetailViewProps = {
  card: CardDetail;
  actions: CardDetailActions;
};

type CardRawView = Record<string, unknown>;

function CardImagePanel({ card }: { card: CardDetail }) {
  return (
    <div className="mx-auto w-full max-w-[320px] min-w-0 sm:max-w-[360px] md:sticky md:top-24 md:mx-0 md:w-[340px] md:min-w-[340px] md:max-w-[340px] lg:w-[360px] lg:min-w-[360px] lg:max-w-[360px]">
      {card.imageLarge ? (
        <CardTiltFrame className="w-full">
          <img
            src={card.imageLarge}
            alt={card.name}
            className="w-full object-contain drop-shadow-md"
          />
        </CardTiltFrame>
      ) : (
        <div className="grid min-h-[420px] place-items-center rounded-2xl border border-border bg-muted/20 text-sm text-muted-foreground">
          No card image available.
        </div>
      )}
    </div>
  );
}

function CardDetailHeader({ card }: { card: CardDetail }) {
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{card.name}</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        {card.rarity ? <Badge>{card.rarity}</Badge> : null}
        {card.supertype ? <Badge variant="outline">{card.supertype}</Badge> : null}
        {card.types.map((type) => (
          <Badge key={type} variant="secondary">
            {type}
          </Badge>
        ))}
      </div>
    </header>
  );
}

function CardMetadata({ card, raw }: { card: CardDetail; raw: CardRawView }) {
  const number = (raw.number as string | undefined) ?? 'n/a';
  const artist = (raw.artist as string | undefined) ?? 'n/a';
  const stage = (raw.level as string | undefined) ?? card.subtypes[0] ?? 'n/a';

  const items = [
    { label: 'Set', value: card.setName },
    { label: 'Collector #', value: number },
    { label: 'Illustrator', value: artist },
    { label: 'HP', value: card.hp ?? 'n/a' },
    { label: 'Type', value: card.types[0] ?? 'n/a' },
    { label: 'Stage', value: stage },
  ];

  return (
    <section className="grid gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
          <p className="text-sm font-medium">{item.value}</p>
        </div>
      ))}
    </section>
  );
}

function CardCollectionActions({ actions }: { actions: CardDetailActions }) {
  return (
    <section className="flex flex-wrap gap-2">
      <Button size="sm" variant={actions.isFavorite ? 'default' : 'outline'} onClick={actions.toggleFavorite}>
        <Heart className={actions.isFavorite ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
        Favorite
      </Button>
      <Button size="sm" variant={actions.isOwned ? 'default' : 'outline'} onClick={actions.toggleOwned}>
        <Library className="h-4 w-4" />
        Owned
      </Button>
      <Button size="sm" variant={actions.isWishlisted ? 'default' : 'outline'} onClick={actions.toggleWishlist}>
        <Bookmark className="h-4 w-4" />
        Wishlist
      </Button>
    </section>
  );
}

function CardDetailTabs({ card, raw, actions }: { card: CardDetail; raw: CardRawView; actions: CardDetailActions }) {
  const attacks = (raw.attacks as Array<Record<string, unknown>> | undefined) ?? [];
  const abilities = (raw.abilities as Array<Record<string, unknown>> | undefined) ?? [];
  const rules = (raw.rules as Array<unknown> | undefined) ?? [];
  const weaknesses = (raw.weaknesses as Array<Record<string, unknown>> | undefined) ?? [];
  const resistances = (raw.resistances as Array<Record<string, unknown>> | undefined) ?? [];
  const retreatCost = (raw.retreatCost as Array<unknown> | undefined) ?? [];
  const legalities = (raw.legalities as Record<string, unknown> | undefined) ?? {};
  const flavorText = (raw.flavorText as string | undefined) ?? '';
  const evolvesFrom = (raw.evolvesFrom as string | undefined) ?? null;
  const regulationMark = (raw.regulationMark as string | undefined) ?? null;
  const number = (raw.number as string | undefined) ?? null;
  const setRaw = (raw.set as Record<string, unknown> | undefined) ?? {};
  const setPrintedTotal = (setRaw.printedTotal as number | undefined) ?? null;
  const setTotal = (setRaw.total as number | undefined) ?? null;
  const collectorPosition = number ? `${number}/${setPrintedTotal ?? setTotal ?? '?'}` : 'n/a';
  const legalitiesSummary = Object.entries(legalities)
    .filter(([, value]) => typeof value === 'string' && String(value).trim().length > 0)
    .map(([key, value]) => `${key}: ${String(value)}`);
  const weaknessSummary = weaknesses.length
    ? weaknesses
        .map((item) => `${String(item.type ?? 'Unknown')} ${String(item.value ?? '')}`.trim())
        .join(', ')
    : 'n/a';
  const resistanceSummary = resistances.length
    ? resistances
        .map((item) => `${String(item.type ?? 'Unknown')} ${String(item.value ?? '')}`.trim())
        .join(', ')
    : 'n/a';
  const retreatSummary = retreatCost.length
    ? retreatCost.map((item) => String(item)).join(', ')
    : 'n/a';
  const subtypes = card.subtypes.length ? card.subtypes.join(', ') : 'n/a';

  return (
    <Tabs defaultValue="overview" className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <TabsList className="h-10 w-max min-w-full justify-start rounded-xl p-1 sm:min-w-0">
          <TabsTrigger className="h-full px-3" value="overview">Overview</TabsTrigger>
          <TabsTrigger className="h-full px-3" value="attacks">Attacks / Abilities</TabsTrigger>
          <TabsTrigger className="h-full px-3" value="set">Set info</TabsTrigger>
          <TabsTrigger className="h-full px-3" value="pricing">Pricing</TabsTrigger>
          <TabsTrigger className="h-full px-3" value="notes">Personal notes</TabsTrigger>
        </TabsList>
      </div>

      <div className="min-w-0">
        <TabsContent value="overview" className="space-y-4 rounded-xl border border-border/70 bg-background p-4 sm:p-5">
          <section className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Card story</p>
            {flavorText ? <p className="text-sm leading-relaxed text-muted-foreground">{flavorText}</p> : <p className="text-sm text-muted-foreground">No flavor text available.</p>}
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Evolves from</p>
                <p className="font-medium">{evolvesFrom ?? 'n/a'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Rules</p>
                <p className="font-medium">{rules.length ? String(rules[0]) : 'n/a'}</p>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Print facts</p>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Collector position</p><p className="font-medium">{collectorPosition}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Regulation mark</p><p className="font-medium">{regulationMark ?? 'n/a'}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Subtypes</p><p className="font-medium">{subtypes}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Legalities</p><p className="font-medium">{legalitiesSummary[0] ?? 'n/a'}</p></div>
            </div>
          </section>

          <Separator />

          <section className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Combat snapshot</p>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Weaknesses</p><p className="font-medium">{weaknessSummary}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Resistances</p><p className="font-medium">{resistanceSummary}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Retreat cost</p><p className="font-medium">{retreatSummary}</p></div>
              <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Abilities / attacks</p><p className="font-medium">{abilities.length} / {attacks.length}</p></div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="attacks" className="space-y-4 rounded-xl border border-border/70 bg-background p-4 sm:p-5">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Abilities</p>
            {abilities.length ? abilities.map((ability, index) => <div key={index}><p className="text-sm font-medium">{String(ability.name ?? 'Ability')}</p><p className="text-sm text-muted-foreground">{String(ability.text ?? '')}</p></div>) : <p className="text-sm text-muted-foreground">No abilities listed.</p>}
          </div>
          <Separator />
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Attacks</p>
            {attacks.length ? attacks.map((attack, index) => <div key={index}><p className="text-sm font-medium">{String(attack.name ?? 'Attack')}</p><p className="text-sm text-muted-foreground">{String(attack.text ?? '')}</p></div>) : <p className="text-sm text-muted-foreground">No attacks listed.</p>}
          </div>
        </TabsContent>

        <TabsContent value="set" className="space-y-3 rounded-xl border border-border/70 bg-background p-4 text-sm sm:p-5">
          <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Subtypes</p><p className="font-medium">{subtypes}</p></div>
          <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Weaknesses</p><p className="text-muted-foreground">{JSON.stringify(raw.weaknesses ?? [])}</p></div>
          <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Resistances</p><p className="text-muted-foreground">{JSON.stringify(raw.resistances ?? [])}</p></div>
          <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Retreat Cost</p><p className="text-muted-foreground">{JSON.stringify(raw.retreatCost ?? [])}</p></div>
          <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Legalities</p><p className="text-muted-foreground">{JSON.stringify(raw.legalities ?? {})}</p></div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-3">
          <CardmarketTab card={card} />
        </TabsContent>

        <TabsContent value="notes" className="space-y-2 rounded-xl border border-border/70 bg-background p-4 sm:p-5">
          <Textarea
            value={actions.note}
            onChange={(e) => actions.setNote(e.target.value)}
            placeholder="Add personal notes for this card"
            className="min-h-28"
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}

export function CardDetailView({ card, actions }: CardDetailViewProps) {
  const raw = (card.raw as CardRawView) ?? {};

  return (
    <div className="space-y-8 py-2">
      <div className="grid items-start gap-6 md:grid-cols-[320px_1fr] md:gap-8 lg:grid-cols-[360px_1fr]">
        <CardImagePanel card={card} />
        <section className="min-w-0 space-y-6">
          <CardDetailHeader card={card} />
          <CardMetadata card={card} raw={raw} />
          <CardCollectionActions actions={actions} />
        </section>
      </div>
      <CardDetailTabs card={card} raw={raw} actions={actions} />
    </div>
  );
}
