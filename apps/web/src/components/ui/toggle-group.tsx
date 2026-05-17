'use client';
import { cn } from '@/lib/utils';

export function ToggleGroup({ value, onValueChange, options, className }: { value: string; onValueChange: (value: string) => void; options: { value: string; label: string }[]; className?: string }) {
  return (
    <div className={cn('inline-flex rounded-xl border border-input bg-background p-1', className)}>
      {options.map((option) => (
        <button key={option.value} type="button" onClick={() => onValueChange(option.value)} className={cn('rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', value === option.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
