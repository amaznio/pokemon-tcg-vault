import './globals.css';
import { Geist } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Providers } from '@/components/providers';
import { AppShell } from '@/components/layout/app-shell';
import { TooltipProvider } from '@/components/ui/tooltip';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'TCG Vault',
  description: 'Pokemon card discovery and collection app',
  other: {
    google: 'notranslate',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <TooltipProvider>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </TooltipProvider>
      </body>
    </html>
  );
}
