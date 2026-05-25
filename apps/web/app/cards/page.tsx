'use client';

import { Suspense } from 'react';
import { CardBrowserPage } from '@/components/cards/card-browser-page';

export default function CardsPage() {
  return (
    <Suspense fallback={null}>
      <CardBrowserPage />
    </Suspense>
  );
}
