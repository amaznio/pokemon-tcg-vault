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
        className={cn('h-11 rounded-2xl border-border bg-background pl-10', className)}
        {...props}
      />
    </div>
  );
}
