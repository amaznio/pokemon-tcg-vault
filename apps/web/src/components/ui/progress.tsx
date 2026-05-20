import * as React from 'react';
import { cn } from '@/lib/utils';

function Progress({
  className,
  value = 0,
  ...props
}: React.ComponentProps<'div'> & { value?: number }) {
  return (
    <div
      data-slot="progress"
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export { Progress };
