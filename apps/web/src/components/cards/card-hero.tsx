'use client';

import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function CardHero({ query, onQueryChange, onSearch }: { query: string; onQueryChange: (query: string) => void; onSearch: () => void }) {
  return (
    <section className="mb-6 grid gap-6 lg:grid-cols-[1fr,260px] lg:items-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold leading-tight">
          Find your favorite <span className="text-primary">Pokemon cards</span>
        </h1>
        <p className="text-lg text-muted-foreground">Search by Pokemon, set, rarity, type, or collector number.</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => onQueryChange(e.target.value)} className="h-11 rounded-xl pl-10" placeholder="Search Pikachu, Charizard, trainer..." />
          </div>
          <Button className="h-11 rounded-xl bg-primary text-primary-foreground" onClick={onSearch}>Search</Button>
        </div>
      </div>
      <div className="hidden h-48 rounded-2xl bg-muted lg:block" />
    </section>
  );
}
