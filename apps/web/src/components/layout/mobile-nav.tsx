'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { Menu, PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAIN_NAV_ITEMS } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function MobileNav() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl border-border md:hidden"
            aria-label="Open menu"
          />
        }
      >
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[86vw] max-w-sm p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary">
              <PackageOpen className="size-4" />
            </span>
            TCG Vault
          </SheetTitle>
        </SheetHeader>
        <nav className="space-y-1 p-4">
          {MAIN_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href as Route}
              className={cn(
                'block rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
                pathname === item.href && 'bg-accent text-primary',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
