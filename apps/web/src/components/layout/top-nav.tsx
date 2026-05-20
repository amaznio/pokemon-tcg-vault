'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bell, ChevronDown, PackageOpen, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MAIN_NAV_ITEMS } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { MobileNav } from '@/components/layout/mobile-nav';
import { SearchInput } from '@/components/shared/search-input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSearchQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  const submitSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    const query = searchQuery.trim();
    if (query) params.set('q', query);
    else params.delete('q');
    params.delete('page');
    router.push((`/cards${params.toString() ? `?${params.toString()}` : ''}`) as Route);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-6 py-3 md:px-8">
        <MobileNav />
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
            <PackageOpen className="size-4" />
          </span>
          <span className="text-lg font-semibold tracking-tight">TCG Vault</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {MAIN_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
                pathname === item.href && 'bg-accent text-primary',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form
          className="hidden min-w-0 flex-1 lg:block"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch();
          }}
        >
          <SearchInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search Pikachu, Charizard, trainer..."
            autoComplete="off"
          />
        </form>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-full border-border" aria-label="Toggle theme">
            <Sun className="size-4" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full border-border" aria-label="Notifications">
            <Bell className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="h-10 rounded-full border-border px-1.5 pr-2" />
              }
            >
              <Avatar className="size-7">
                <AvatarFallback>AT</AvatarFallback>
              </Avatar>
              <ChevronDown className="size-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 pb-3 md:px-8 lg:hidden">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch();
          }}
        >
          <SearchInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search Pikachu, Charizard, trainer..."
            autoComplete="off"
          />
        </form>
      </div>
    </header>
  );
}
