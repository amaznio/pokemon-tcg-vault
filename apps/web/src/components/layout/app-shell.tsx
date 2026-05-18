import { MainNav } from '@/components/layout/main-nav';
import { PageContainer } from '@/components/layout/page-container';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <PageContainer>{children}</PageContainer>
    </div>
  );
}
