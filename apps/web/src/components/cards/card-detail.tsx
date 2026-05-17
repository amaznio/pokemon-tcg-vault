'use client';
import { useState } from 'react';
import type { CardDetail } from '@repo/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent } from '@/components/ui/tabs';

export function CardDetailView({ card, actions }: { card: CardDetail; actions: { isFavorite: boolean; isOwned: boolean; isWishlisted: boolean; toggleFavorite: () => void; toggleOwned: () => void; toggleWishlist: () => void; note: string; setNote: (v: string) => void } }) {
  const [tab, setTab] = useState('overview');
  const raw = (card.raw as Record<string, unknown>) ?? {};
  const attacks = (raw.attacks as Array<Record<string, unknown>> | undefined) ?? [];
  const abilities = (raw.abilities as Array<Record<string, unknown>> | undefined) ?? [];
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px),1fr]">
      <Card><CardContent className="p-4">{card.imageLarge ? <img src={card.imageLarge} alt={card.name} className="mx-auto w-full max-w-md object-contain" /> : null}</CardContent></Card>
      <Card>
        <CardHeader>
          <CardTitle>{card.name}</CardTitle>
          <div className="flex flex-wrap gap-1">{card.rarity ? <Badge>{card.rarity}</Badge> : null}{card.supertype ? <Badge variant="outline">{card.supertype}</Badge> : null}{card.types.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}</div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant={actions.isFavorite ? 'default' : 'outline'} onClick={actions.toggleFavorite}>Favorite</Button>
            <Button variant={actions.isOwned ? 'default' : 'outline'} onClick={actions.toggleOwned}>Owned</Button>
            <Button variant={actions.isWishlisted ? 'default' : 'outline'} onClick={actions.toggleWishlist}>Wishlist</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onChange={setTab} tabs={[{ value: 'overview', label: 'Overview' }, { value: 'attacks', label: 'Attacks / Abilities' }, { value: 'set', label: 'Set info' }, { value: 'notes', label: 'Personal notes' }]}>
            <TabsContent value="overview" activeValue={tab}><div className="space-y-2 text-sm"><p>Set: {card.setName}</p><p>HP: {card.hp ?? 'n/a'}</p><p>Number: {(raw.number as string | undefined) ?? 'n/a'}</p><p>Artist: {(raw.artist as string | undefined) ?? 'n/a'}</p></div></TabsContent>
            <TabsContent value="attacks" activeValue={tab}><div className="space-y-3 text-sm">{abilities.length ? abilities.map((ability, index) => <div key={index}><p className="font-medium">{String(ability.name ?? 'Ability')}</p><p className="text-slate-600">{String(ability.text ?? '')}</p></div>) : <p className="text-slate-600">No abilities listed.</p>}<Separator />{attacks.length ? attacks.map((attack, index) => <div key={index}><p className="font-medium">{String(attack.name ?? 'Attack')}</p><p className="text-slate-600">{String(attack.text ?? '')}</p></div>) : <p className="text-slate-600">No attacks listed.</p>}</div></TabsContent>
            <TabsContent value="set" activeValue={tab}><div className="space-y-2 text-sm"><p>Subtypes: {card.subtypes.join(', ') || 'n/a'}</p><p>Weaknesses: {JSON.stringify(raw.weaknesses ?? [])}</p><p>Resistances: {JSON.stringify(raw.resistances ?? [])}</p><p>Retreat cost: {JSON.stringify(raw.retreatCost ?? [])}</p><p>Legalities: {JSON.stringify(raw.legalities ?? {})}</p></div></TabsContent>
            <TabsContent value="notes" activeValue={tab}><Input value={actions.note} onChange={(e) => actions.setNote(e.target.value)} placeholder="Add personal notes for this card" /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
