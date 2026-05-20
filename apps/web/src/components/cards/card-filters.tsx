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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';

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
  selectedLabel,
  placeholder,
  options,
  onValueChange,
  className,
  contentClassName,
  valueClassName,
}: {
  value: string;
  selectedLabel?: string;
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
        {selectedLabel ? (
          <span className={['truncate', valueClassName].filter(Boolean).join(' ')}>{selectedLabel}</span>
        ) : (
          <SelectValue placeholder={placeholder} className={['truncate', valueClassName].filter(Boolean).join(' ')} />
        )}
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

export function CardFilters({
  value,
  onChange,
  setOptions,
  pageSize,
  onPageSizeChange,
  useLargeImages,
  onUseLargeImagesChange,
  layoutMode,
  onLayoutModeChange,
}: {
  value: DiscoveryFilters;
  onChange: (next: DiscoveryFilters) => void;
  setOptions: { label: string; value: string }[];
  pageSize: number;
  onPageSizeChange: (next: number) => void;
  useLargeImages: boolean;
  onUseLargeImagesChange: (next: boolean) => void;
  layoutMode: 'grid' | 'list';
  onLayoutModeChange: (next: 'grid' | 'list') => void;
}) {
  const selectedSetLabel = setOptions.find((option) => option.value === value.set)?.label;

  const topFilters = (
    <>
      <FilterSelect
        value={value.set}
        {...(selectedSetLabel ? { selectedLabel: selectedSetLabel } : {})}
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
    </>
  );

  return (
    <section className="space-y-4 border-b border-border pb-4">
      <div className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]">
        {topFilters}
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
      <div className="md:hidden">
        <Drawer>
          <DrawerTrigger
            render={
              <Button variant="outline" className={`${FILTER_CONTROL_HEIGHT} w-full rounded-xl border-border px-4`}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
              </Button>
            }
          />
          <DrawerContent className="max-h-[88vh] overflow-y-auto pb-4">
            <DrawerHeader className="px-6">
              <DrawerTitle>Filters</DrawerTitle>
              <DrawerDescription>Refine card results using filters and sorting.</DrawerDescription>
            </DrawerHeader>
            <div className="mt-2 space-y-4 px-6 pb-6">
              <div className="grid gap-3">
                {topFilters}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FilterSelect
            value={value.sort}
            onValueChange={(sort) => onChange({ ...value, sort: sort ?? 'relevance' })}
            placeholder="Sort"
            options={[{ value: 'number', label: 'Number' }, { value: 'relevance', label: 'Relevance' }, { value: 'name', label: 'Name' }, { value: 'set', label: 'Set' }, { value: 'rarity', label: 'Rarity' }]}
            className="h-10 w-48"
            contentClassName="min-w-48"
            valueClassName="capitalize"
          />
          <Select
            value={String(pageSize)}
            onValueChange={(next) => onPageSizeChange(Number(next))}
          >
            <SelectTrigger className="h-10 w-28 rounded-xl border-border">
              <SelectValue placeholder="Results" />
            </SelectTrigger>
            <SelectContent className="min-w-28">
              <SelectGroup>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="40">40</SelectItem>
                <SelectItem value="60">60</SelectItem>
                <SelectItem value="80">80</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            variant={useLargeImages ? 'default' : 'outline'}
            className="h-8 min-w-24 rounded-xl border-border px-4"
            onClick={() => onUseLargeImagesChange(!useLargeImages)}
          >
            {useLargeImages ? 'Large' : 'Small'}
          </Button>
          <Tabs value={layoutMode} onValueChange={(next) => onLayoutModeChange(next as 'grid' | 'list')}>
            <TabsList className="h-10 rounded-xl border border-border bg-background p-1">
              <TabsTrigger value="grid" className="h-full min-w-9 rounded-lg px-2" aria-label="Grid layout">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="h-full min-w-9 rounded-lg px-2" aria-label="List layout">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
