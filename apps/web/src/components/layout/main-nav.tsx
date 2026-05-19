'use client';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { Bell, Menu, Search, Sun } from 'lucide-react';
import { useState } from 'react';
import { RecentCardList } from '@/components/cards/recent-card-list';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const navItems: { href: Route; label: string }[] = [
  // { href: '/', label: 'Dashboard' },
  { href: '/cards', label: 'Cards' },
  { href: '/sets', label: 'Sets' },
  { href: '/favorites', label: 'Favorites' },
  { href: '/collection', label: 'Collection' },
  { href: '/wishlist', label: 'Wishlist' },
];

export function MainNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/90">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 xl:gap-4">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl border-border xl:hidden"
                  aria-label="Open navigation menu"
                />
              }
            >
              <Menu className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[86vw] max-w-sm p-0">
              <SheetHeader className="border-b border-border p-4">
                <SheetTitle>TCG Vault</SheetTitle>
                <SheetDescription>Browse cards, sets, and your collection.</SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-5 p-4">
                <nav className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        'rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                        pathname === item.href && 'bg-muted text-foreground',
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Recent</p>
                  <RecentCardList />
                </div>

                <div className="rounded-2xl border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground">Pikachu Fan</p>
                  <p className="text-sm font-semibold text-foreground">Collector</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link
            href={'/'}
            className="shrink-0 text-lg font-semibold tracking-tight text-foreground"
          >
            TCG Vault
          </Link>

          <nav className="hidden items-center gap-1 xl:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  pathname === item.href && 'bg-muted text-foreground',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden min-w-0 flex-1 items-center xl:flex">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search Pikachu, Charizard, trainer..."
                className="h-10 rounded-xl border-border bg-card pl-10"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-border"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-border"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <div
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-sm"
              aria-label="Profile"
            >
              🟡
            </div>
          </div>
        </div>

        <div className="xl:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search Pikachu, Charizard, trainer..."
              className="h-10 rounded-xl border-border bg-card pl-10"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
