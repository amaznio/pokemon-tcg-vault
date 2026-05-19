'use client';

import { ChevronDown, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export type DiscoveryFilters = {
  query: string;
  set: string;
  type: string;
  rarity: string[];
  supertype: string;
  scope: 'all' | 'favorites' | 'owned' | 'wishlist';
  sort: string;
};

const typeOptions = ['Fire', 'Water', 'Grass', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Dragon', 'Colorless'];
const rarityOptions = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Illustration Rare', 'Special Illustration Rare', 'Ultra Rare', 'Hyper Rare'];
const supertypeOptions = ['Pokémon', 'Trainer', 'Energy'];
const FILTER_CONTROL_HEIGHT = '!h-10';

function FilterSelect({
  value,
  placeholder,
  options,
  onValueChange,
  className,
  contentClassName,
  valueClassName,
}: {
  value: string;
  placeholder: string;
  options: { label: string; value: string }[];
  onValueChange: (next: string | null) => void;
  className?: string;
  contentClassName?: string;
  valueClassName?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} className={['truncate', valueClassName].filter(Boolean).join(' ')} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        <SelectGroup>
          <SelectItem value="all">All</SelectItem>
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

function RarityMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const triggerLabel =
    value.length === 0
      ? 'Rarity'
      : value.length === 1
        ? value[0]
        : `${value.length} rarities`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className={`${FILTER_CONTROL_HEIGHT} w-full min-w-0 justify-between rounded-xl border-border px-3 font-normal text-foreground`}
          />
        }
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-72">
        <DropdownMenuGroup>
          <DropdownMenuCheckboxItem
            checked={value.length === 0}
            onCheckedChange={() => onChange([])}
          >
            All
          </DropdownMenuCheckboxItem>
          {rarityOptions.map((option) => (
            <DropdownMenuCheckboxItem
              key={option}
              checked={value.includes(option)}
              onCheckedChange={(checked) => {
                if (checked) {
                  onChange([...value, option]);
                  return;
                }
                onChange(value.filter((entry) => entry !== option));
              }}
            >
              {option}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CardFilters({ value, onChange, setOptions }: { value: DiscoveryFilters; onChange: (next: DiscoveryFilters) => void; setOptions: { label: string; value: string }[] }) {
  return (
    <section className="space-y-4 border-b border-border pb-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]">
        <FilterSelect
          value={value.set}
          onValueChange={(set) => onChange({ ...value, set: !set || set === 'all' ? '' : set })}
          placeholder="Set"
          options={setOptions}
          className={`${FILTER_CONTROL_HEIGHT} w-full min-w-0 rounded-xl border-border`}
          contentClassName="min-w-56"
        />
        <FilterSelect
          value={value.type}
          onValueChange={(type) => onChange({ ...value, type: !type || type === 'all' ? '' : type })}
          placeholder="Type"
          options={typeOptions.map((option) => ({ label: option, value: option }))}
          className={`${FILTER_CONTROL_HEIGHT} w-full min-w-0 rounded-xl border-border`}
          contentClassName="min-w-56"
        />
        <RarityMultiSelect value={value.rarity} onChange={(rarity) => onChange({ ...value, rarity })} />
        <FilterSelect
          value={value.supertype}
          onValueChange={(supertype) => onChange({ ...value, supertype: !supertype || supertype === 'all' ? '' : supertype })}
          placeholder="Supertype"
          options={supertypeOptions.map((option) => ({ label: option, value: option }))}
          className={`${FILTER_CONTROL_HEIGHT} w-full min-w-0 rounded-xl border-border`}
          contentClassName="min-w-56"
        />
        <Sheet>
          <SheetTrigger render={<Button variant="outline" className={`${FILTER_CONTROL_HEIGHT} rounded-xl border-border px-4`}><SlidersHorizontal className="mr-2 h-4 w-4" />Advanced filters</Button>} />
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Advanced filters</SheetTitle>
              <SheetDescription>Advanced filters can be expanded here.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          value={[value.scope]}
          onValueChange={(scope) => onChange({ ...value, scope: (scope[0] ?? 'all') as DiscoveryFilters['scope'] })}
          spacing={0}
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="favorites">Favorites</ToggleGroupItem>
          <ToggleGroupItem value="owned">Owned</ToggleGroupItem>
          <ToggleGroupItem value="wishlist">Wishlist</ToggleGroupItem>
        </ToggleGroup>
        <div className="flex items-center gap-2">
          <FilterSelect
            value={value.sort}
            onValueChange={(sort) => onChange({ ...value, sort: sort ?? 'relevance' })}
            placeholder="Sort"
            options={[{ value: 'relevance', label: 'Relevance' }, { value: 'name', label: 'Name' }, { value: 'set', label: 'Set' }, { value: 'rarity', label: 'Rarity' }]}
            className="h-10 w-48"
            contentClassName="min-w-48"
            valueClassName="capitalize"
          />
          <Button variant="outline" size="icon" className="rounded-xl border-border"><LayoutGrid className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" className="rounded-xl border-border"><List className="h-4 w-4" /></Button>
        </div>
      </div>
    </section>
  );
}
