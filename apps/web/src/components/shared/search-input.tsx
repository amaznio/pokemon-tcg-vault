'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export function SearchInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className={cn(
          'h-11 rounded-xl border-border bg-background pl-10 focus-visible:ring-2 focus-visible:ring-ring/40',
          className,
        )}
        {...props}
      />
    </div>
  );
}
