'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bell, ChevronDown, LogOut, PackageOpen, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { MAIN_NAV_ITEMS } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { MobileNav } from '@/components/layout/mobile-nav';
import { SearchInput } from '@/components/shared/search-input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const auth = useAuth();

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
          {auth.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className={cn(buttonVariants({ variant: 'outline' }), 'h-10 rounded-xl border-border px-1.5 pr-2')}
                  />
                }
              >
                <Avatar className="size-7">
                  <AvatarFallback>{auth.user.email?.slice(0, 2).toUpperCase() ?? 'U'}</AvatarFallback>
                </Avatar>
                <ChevronDown className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)]">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-2 py-1.5 text-sm font-medium text-foreground">
                    <span className="block truncate">{auth.user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => auth.logout.mutate()}>
                    <LogOut />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" className="rounded-full border-border" render={<Link href={'/auth' as Route} />}>
              Sign in
            </Button>
          )}
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
