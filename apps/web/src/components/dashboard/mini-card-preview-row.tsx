'use client';

import { useRef } from 'react';
import type { MiniCardItem } from '@/lib/dashboard/mock-dashboard-data';
import { MiniCardPreview } from '@/components/dashboard/mini-card-preview';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MiniCardPreviewRow({
  items,
  variant,
}: {
  items: MiniCardItem[];
  variant: 'favorite' | 'wishlist';
}) {
  const desktopScrollRootRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div
        className="w-full overflow-x-auto md:hidden"
        onWheel={(event) => {
          if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
            event.currentTarget.scrollLeft += event.deltaY;
            event.preventDefault();
          }
        }}
      >
        <div className="flex min-w-max gap-4">
          {items.map((item) => (
            <MiniCardPreview key={item.id} item={item} variant={variant} size="compact" />
          ))}
        </div>
      </div>

      <div
        ref={desktopScrollRootRef}
        className="relative hidden md:block"
        onWheel={(event) => {
          if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
          const viewport = desktopScrollRootRef.current?.querySelector(
            '[data-slot="scroll-area-viewport"]',
          ) as HTMLDivElement | null;
          if (!viewport) return;
          viewport.scrollLeft += event.deltaY;
          event.preventDefault();
        }}
      >
        <ScrollArea className="w-full">
          <div className="flex min-w-max snap-x snap-mandatory gap-4 pr-1">
            {items.map((item) => (
              <MiniCardPreview
                key={item.id}
                item={item}
                variant={variant}
                size="cardsBaseline"
                className="md:snap-start"
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
