'use client';

import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { ToggleGroup } from '@/components/ui/toggle-group';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export type DiscoveryFilters = {
  query: string;
  set: string;
  type: string;
  rarity: string;
  supertype: string;
  scope: 'all' | 'favorites' | 'owned' | 'wishlist';
  sort: string;
};

export function CardFilters({ value, onChange, setOptions }: { value: DiscoveryFilters; onChange: (next: DiscoveryFilters) => void; setOptions: { label: string; value: string }[] }) {
  return (
    <section className="space-y-4 border-b border-border pb-4">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <Select value={value.set} onChange={(set) => onChange({ ...value, set })} placeholder="Set" options={setOptions} />
        <Select value={value.type} onChange={(type) => onChange({ ...value, type })} placeholder="Type" options={['Fire', 'Water', 'Grass', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Dragon', 'Colorless']} />
        <Select value={value.rarity} onChange={(rarity) => onChange({ ...value, rarity })} placeholder="Rarity" options={['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Illustration Rare', 'Special Illustration Rare', 'Ultra Rare', 'Hyper Rare']} />
        <Select value={value.supertype} onChange={(supertype) => onChange({ ...value, supertype })} placeholder="Supertype" options={['Pokémon', 'Trainer', 'Energy']} />
        <Sheet>
          <SheetTrigger render={<Button variant="outline" className="h-10 rounded-xl border-border"><SlidersHorizontal className="mr-2 h-4 w-4" />Advanced filters</Button>} />
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Advanced filters</SheetTitle>
              <SheetDescription>Advanced filters can be expanded here.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ToggleGroup value={value.scope} onValueChange={(scope) => onChange({ ...value, scope: scope as DiscoveryFilters['scope'] })} options={[{ value: 'all', label: 'All' }, { value: 'favorites', label: 'Favorites' }, { value: 'owned', label: 'Owned' }, { value: 'wishlist', label: 'Wishlist' }]} />
        <div className="flex items-center gap-2">
          <Select value={value.sort} onChange={(sort) => onChange({ ...value, sort })} placeholder="Sort" options={[{ value: 'relevance', label: 'Relevance' }, { value: 'name', label: 'Name' }, { value: 'set', label: 'Set' }, { value: 'rarity', label: 'Rarity' }]} className="w-44" />
          <Button variant="outline" size="icon" className="rounded-xl border-border"><LayoutGrid className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="rounded-xl border-border"><List className="h-4 w-4" /></Button>
        </div>
      </div>
    </section>
  );
}
