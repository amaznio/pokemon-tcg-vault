'use client';

import { Bell, Search, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function TopSearch() {
  return (
    <div className="mb-8 flex items-center gap-3">
      <SidebarTrigger />
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search Pikachu, Charizard, trainer..." className="h-11 rounded-xl border-border bg-card pl-10" />
      </div>
      <Button variant="outline" size="icon" className="rounded-full border-border"><Sun className="h-4 w-4" /></Button>
      <Button variant="outline" size="icon" className="rounded-full border-border"><Bell className="h-4 w-4" /></Button>
      <div className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-sm">🟡</div>
    </div>
  );
}
