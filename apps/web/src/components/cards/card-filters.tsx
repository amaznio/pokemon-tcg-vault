'use client';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ToggleGroup } from '@/components/ui/toggle-group';
import { Sheet } from '@/components/ui/sheet';

export type DiscoveryFilters = {
  query: string;
  set: string;
  type: string;
  rarity: string;
  supertype: string;
  scope: 'all' | 'favorites' | 'owned' | 'wishlist';
};

export function CardFilters({ value, onChange, onSearch }: { value: DiscoveryFilters; onChange: (next: DiscoveryFilters) => void; onSearch: () => void }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Find your favorite Pokemon cards</CardTitle>
        <CardDescription>Search by Pokemon, set, rarity, type, or collector number.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input value={value.query} onChange={(e) => onChange({ ...value, query: e.target.value })} placeholder="Search Pikachu, Charizard, trainer..." />
          <Button onClick={onSearch}><Search className="h-4 w-4" />Search</Button>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Select value={value.set} onChange={(set) => onChange({ ...value, set })} placeholder="Set" options={[]} />
          <Select value={value.type} onChange={(type) => onChange({ ...value, type })} placeholder="Type" options={['Fire','Water','Grass','Lightning','Psychic','Fighting','Darkness','Metal','Dragon','Colorless']} />
          <Select value={value.rarity} onChange={(rarity) => onChange({ ...value, rarity })} placeholder="Rarity" options={['Common','Uncommon','Rare','Rare Holo']} />
          <Select value={value.supertype} onChange={(supertype) => onChange({ ...value, supertype })} placeholder="Supertype" options={['Pokemon','Trainer','Energy']} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ToggleGroup value={value.scope} onValueChange={(scope) => onChange({ ...value, scope: scope as DiscoveryFilters['scope'] })} options={[{ value: 'all', label: 'All' },{ value: 'favorites', label: 'Favorites' },{ value: 'owned', label: 'Owned' },{ value: 'wishlist', label: 'Wishlist' }]} />
          <Sheet title="Advanced filters" triggerLabel="Advanced filters">
            <p className="text-sm text-slate-600">Advanced filters are ready for expansion.</p>
          </Sheet>
        </div>
      </CardContent>
    </Card>
  );
}
