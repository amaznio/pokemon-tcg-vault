'use client';

import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { CollectionFilterOption } from '@/lib/collection/collection-browse';

export function CollectionRarityFilter({
  value,
  options,
  onChange,
  className,
}: {
  value: string[];
  options: CollectionFilterOption[];
  onChange: (value: string[]) => void;
  className?: string;
}) {
  const labelForValue = (entry: string): string =>
    options.find((option) => option.value === entry)?.label ?? entry;
  const triggerLabel =
    value.length === 0
      ? 'Rarity'
      : value.length === 1
        ? labelForValue(value[0] ?? '')
        : `${value.length} rarities`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              'h-10 w-full min-w-0 justify-between rounded-xl border-border px-3 font-normal',
              className,
            )}
          />
        }
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown data-icon="inline-end" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-64">
        <DropdownMenuGroup>
          <DropdownMenuCheckboxItem
            checked={value.length === 0}
            onCheckedChange={() => onChange([])}
          >
            All rarities
          </DropdownMenuCheckboxItem>
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={value.includes(option.value)}
              onCheckedChange={(checked) => {
                if (checked) {
                  onChange([...value, option.value]);
                  return;
                }
                onChange(value.filter((entry) => entry !== option.value));
              }}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
