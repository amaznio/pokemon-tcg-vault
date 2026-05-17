'use client';
import Link from 'next/link';
import type { Route } from 'next';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const quickLinks: { href: Route; label: string }[] = [
  { href: '/cards', label: 'Browse cards' },
  { href: '/sets', label: 'Browse sets' },
  { href: '/favorites', label: 'Favorites' },
  { href: '/collection', label: 'Collection' },
  { href: '/wishlist', label: 'Wishlist' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-2xl">Build your personal Pokemon card vault</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2"><Input placeholder="Search cards" /><Link href={'/cards'}><Button><Search className="h-4 w-4" />Go to search</Button></Link></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{quickLinks.map((link) => <Link key={link.href} href={link.href} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">{link.label}</Link>)}</div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-base">Recently viewed</CardTitle></CardHeader><CardContent className="text-sm text-slate-600">Open card details to build your history.</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Favorite cards</CardTitle></CardHeader><CardContent className="text-sm text-slate-600">Your favorites will appear here.</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Wishlist highlights</CardTitle></CardHeader><CardContent className="text-sm text-slate-600">Track wanted cards for trades and buys.</CardContent></Card>
      </div>
    </div>
  );
}
