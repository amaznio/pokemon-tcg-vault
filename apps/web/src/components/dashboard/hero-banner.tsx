'use client';

import { useState } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/shared/search-input';

export function HeroBanner() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#f5f2ff] via-[#f7f7fe] to-[#f1efff] p-6 sm:p-8 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <p className="text-lg font-semibold text-primary">Welcome back! 👋</p>
          <h1 className="text-4xl font-bold leading-tight text-foreground">
            Build your personal
            <br />
            <span className="text-primary">Pokémon</span> card vault
          </h1>
          <p className="text-lg text-muted-foreground">Search, discover, and organize your favorite cards.</p>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              router.push((`/cards${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`) as Route);
            }}
          >
            <div className="flex-1">
              <SearchInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search cards by name, type, set, or number..."
                className="bg-card"
              />
            </div>
            <Button type="submit" size="lg" className="h-11 rounded-2xl px-6">
              <Search className="size-4" />
              Search
            </Button>
          </form>
        </div>

        <div className="relative hidden min-h-[260px] lg:block">
          <div className="absolute bottom-0 left-8 h-28 w-40 rounded-t-full bg-primary/10" />
          <div className="absolute bottom-0 left-28 h-36 w-44 rounded-t-full bg-primary/10" />
          <div className="absolute bottom-0 right-8 h-32 w-40 rounded-t-full bg-primary/10" />
          <div className="absolute right-20 top-6 h-56 w-44 rotate-12 rounded-3xl border-4 border-primary/15 bg-white/35" />
          <div className="absolute right-28 top-16 h-40 w-32 rounded-2xl border-4 border-primary/20" />
          <div className="absolute right-36 top-26 h-16 w-16 rounded-full border-4 border-primary/20" />
          <span className="absolute left-8 top-8 text-xl text-primary/60">✦</span>
          <span className="absolute left-28 top-24 text-sm text-primary/50">✦</span>
          <span className="absolute right-8 top-10 text-xl text-amber-400">✦</span>
          <span className="absolute right-10 top-36 text-sm text-primary/60">✦</span>
        </div>
      </div>
    </section>
  );
}
