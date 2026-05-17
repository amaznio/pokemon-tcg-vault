'use client';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems: { href: Route; label: string }[] = [
  { href: '/cards', label: 'Cards' },
  { href: '/sets', label: 'Sets' },
  { href: '/favorites', label: 'Favorites' },
  { href: '/collection', label: 'Collection' },
  { href: '/wishlist', label: 'Wishlist' },
];

export function MainNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={'/'} className="text-lg font-semibold tracking-tight">TCG Vault</Link>
        <nav className="flex flex-wrap items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn('rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100', pathname === item.href ? 'bg-slate-900 text-white hover:bg-slate-900' : '')}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Button variant="ghost" size="icon" aria-label="Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
