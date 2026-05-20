'use client';

import { useState } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/shared/search-input';
import { cn } from '@/lib/utils';
import { homeSpacing, homeTypography } from '@/components/dashboard/home-styles';

export function HeroBanner() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-accent/25 to-muted p-6">
      <div className="grid items-center gap-6 lg:grid-cols-2">
        <div className={cn('space-y-4', homeSpacing.sectionStack)}>
          <p className={homeTypography.heroEyebrow}>Welcome back! 👋</p>
          <h1 className={homeTypography.heroTitle}>
            Build your personal
            <br />
            <span className="text-primary">Pokémon</span> card vault
          </h1>
          <p className={homeTypography.heroSubtitle}>Search, discover, and organize your favorite cards.</p>
          <form
            className="flex flex-col gap-4 sm:flex-row"
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
            <Button type="submit" size="lg" className="h-11 rounded-xl px-6">
              <Search className="size-4" />
              Search
            </Button>
          </form>
        </div>

        <div className="relative hidden min-h-[210px] lg:block">
          <div className="absolute bottom-0 left-8 h-24 w-36 rounded-t-full bg-primary/10" />
          <div className="absolute bottom-0 left-24 h-[120px] w-40 rounded-t-full bg-primary/10" />
          <div className="absolute bottom-0 right-8 h-28 w-36 rounded-t-full bg-primary/10" />
          <div className="absolute right-20 top-5 h-48 w-40 rotate-12 rounded-2xl border-4 border-primary/15 bg-background/35" />
          <div className="absolute right-28 top-12 h-36 w-28 rounded-2xl border-4 border-primary/20" />
          <div className="absolute right-[8.5rem] top-[5.5rem] h-14 w-14 rounded-full border-4 border-primary/20" />
          <span className="absolute left-8 top-8 text-xl text-primary/60">✦</span>
          <span className="absolute left-28 top-24 text-sm text-primary/50">✦</span>
          <span className="absolute right-8 top-10 text-xl text-primary/60">✦</span>
          <span className="absolute right-10 top-36 text-sm text-primary/60">✦</span>
        </div>
      </div>
    </section>
  );
}
