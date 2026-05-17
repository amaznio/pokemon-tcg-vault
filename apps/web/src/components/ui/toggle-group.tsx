'use client';
import { cn } from '@/lib/utils';

export function ToggleGroup({ value, onValueChange, options, className }: { value: string; onValueChange: (value: string) => void; options: { value: string; label: string }[]; className?: string }) {
  return (
    <div className={cn('inline-flex rounded-xl border border-slate-200 p-1', className)}>
      {options.map((option) => (
        <button key={option.value} type="button" onClick={() => onValueChange(option.value)} className={cn('rounded-lg px-3 py-1.5 text-xs font-medium', value === option.value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
