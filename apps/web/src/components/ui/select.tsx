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
    <select value={value} onChange={(e) => onChange(e.target.value)} className={cn('h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none', className)}>
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
