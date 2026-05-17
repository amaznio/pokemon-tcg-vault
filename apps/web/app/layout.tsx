import './globals.css';
import Link from 'next/link';
import { Providers } from '@/components/providers';

export const metadata = {
  title: 'Pokemon TCG Viewer',
  description: 'Pokemon card and set viewer with local collections',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <main>
            <nav className="row" style={{ marginBottom: 20 }}>
              <Link href="/">Cards</Link>
              <Link href="/sets">Sets</Link>
              <Link href="/collection">My Collection</Link>
            </nav>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}