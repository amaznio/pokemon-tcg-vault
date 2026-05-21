'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { Grid3X3, Heart, Library, LayoutDashboard, Package, Search, Sparkles } from 'lucide-react';
import { RecentCardList } from '@/components/cards/recent-card-list';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cards', label: 'Cards', icon: Grid3X3 },
  { href: '/sets', label: 'Sets', icon: Package },
  { href: '/linkage', label: 'Linkage', icon: Search },
  { href: '/linkage/products', label: 'CM Products', icon: Search },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/collection', label: 'Collection', icon: Library },
  { href: '/wishlist', label: 'Wishlist', icon: Sparkles },
] satisfies { href: Route; label: string; icon: React.ComponentType<{ className?: string }> }[];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas" className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card">
            <Search className="h-4 w-4 text-primary" />
          </div>
          <span className="text-2xl font-semibold tracking-tight text-foreground">TCG Vault</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton render={<Link href={item.href} />} isActive={pathname === item.href} tooltip={item.label} className="h-10 rounded-xl px-3 text-base">
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-3" />

        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 text-sm">Recent</SidebarGroupLabel>
          <SidebarGroupContent>
            <RecentCardList />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Pikachu Fan</p>
          <p className="text-sm font-semibold text-foreground">Collector</p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
