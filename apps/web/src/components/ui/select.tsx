'use client';
import { cn } from '@/lib/utils';

type SelectOption = string | { label: string; value: string };

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  className?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={cn('h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40', className)}>
      <option value="">{placeholder}</option>
      {options.map((option) => {
        const resolved = typeof option === 'string' ? { value: option, label: option } : option;
        return (
          <option key={resolved.value} value={resolved.value}>
            {resolved.label}
          </option>
        );
      })}
    </select>
  );
}
