import { Suspense } from 'react';
import { TopNav } from '@/components/layout/top-nav';
import { PageContainer } from '@/components/layout/page-container';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <TopNav />
      </Suspense>
      <PageContainer>{children}</PageContainer>
    </div>
  );
}
