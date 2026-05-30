'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CollectionFilterOption } from '@/lib/collection/collection-browse';

export function CollectionFilterSelect({
  value,
  placeholder,
  options,
  onChange,
  className,
  includeAll = true,
  allLabel,
}: {
  value: string;
  placeholder: string;
  options: CollectionFilterOption[];
  onChange: (value: string) => void;
  className?: string;
  includeAll?: boolean;
  allLabel?: string;
}) {
  const selectedLabel = (selectedValue: string | null | undefined): string => {
    if (!selectedValue) return placeholder;
    if (selectedValue === 'all') return allLabel ?? `All ${placeholder.toLowerCase()}`;

    return options.find((option) => option.value === selectedValue)?.label ?? selectedValue;
  };

  return (
    <Select value={value} onValueChange={(next) => onChange(!next || next === 'all' ? '' : next)}>
      <SelectTrigger
        className={cn(
          'h-10 min-h-10 w-full min-w-0 rounded-xl border-border data-[size=default]:h-10',
          className,
        )}
      >
        <SelectValue placeholder={placeholder} className="truncate">
          {(selectedValue) => selectedLabel(selectedValue)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-48">
        <SelectGroup>
          {includeAll ? (
            <SelectItem value="all">{allLabel ?? `All ${placeholder.toLowerCase()}`}</SelectItem>
          ) : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
