import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { TopSearch } from '@/components/layout/top-search';
import { PageContainer } from '@/components/layout/page-container';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset className="bg-background">
        <PageContainer>
          <TopSearch />
          {children}
        </PageContainer>
      </SidebarInset>
    </SidebarProvider>
  );
}
