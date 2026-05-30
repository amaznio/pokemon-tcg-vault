'use client';

import { RotateCcw, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CollectionFilterSelect } from '@/components/collection/collection-filter-select';
import { CollectionRarityFilter } from '@/components/collection/collection-rarity-filter';
import {
  collectionSortOptions,
  type CollectionBrowseOptions,
  type CollectionBrowseState,
  type CollectionSort,
} from '@/lib/collection/collection-browse';
import { cn } from '@/lib/utils';

const sortLabels: Record<CollectionSort, string> = {
  recent: 'Recently added',
  updated: 'Recently updated',
  name: 'Name',
  set: 'Set',
  rarity: 'Rarity',
  quantity: 'Quantity',
};

const sortOptions = collectionSortOptions.map((sort) => ({ label: sortLabels[sort], value: sort }));
const detailOptions = [{ label: 'Missing details', value: 'missing' }];
const controlClassName = 'h-10 min-h-10 rounded-xl border-border data-[size=default]:h-10';

export function CollectionControls({
  value,
  options,
  activeFilterCount,
  onChange,
  onReset,
}: {
  value: CollectionBrowseState;
  options: CollectionBrowseOptions;
  activeFilterCount: number;
  onChange: (patch: Partial<CollectionBrowseState>) => void;
  onReset: () => void;
}) {
  return (
    <section className="flex flex-col gap-3 border-b border-border pb-4">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value.query}
            onChange={(event) => onChange({ query: event.target.value })}
            placeholder="Search your collection"
            className={cn(controlClassName, 'pl-10')}
            aria-label="Search collection"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-[680px]">
          <CollectionFilterSelect
            value={value.sort}
            placeholder="Sort"
            options={sortOptions}
            includeAll={false}
            className={controlClassName}
            onChange={(sort) => onChange({ sort: (sort || 'recent') as CollectionSort })}
          />
          <CollectionFilterSelect
            value={value.set}
            placeholder="Set"
            options={options.sets}
            className={controlClassName}
            onChange={(set) => onChange({ set })}
          />
          <CollectionFilterSelect
            value={value.type}
            placeholder="Type"
            options={options.types}
            className={controlClassName}
            onChange={(type) => onChange({ type })}
          />
        </div>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <CollectionRarityFilter
            value={value.rarity}
            options={options.rarities}
            className={controlClassName}
            onChange={(rarity) => onChange({ rarity })}
          />
          <CollectionFilterSelect
            value={value.supertype}
            placeholder="Supertype"
            options={options.supertypes}
            className={controlClassName}
            onChange={(supertype) => onChange({ supertype })}
          />
          <CollectionFilterSelect
            value={value.condition}
            placeholder="Condition"
            options={options.conditions}
            className={controlClassName}
            onChange={(condition) => onChange({ condition })}
          />
          <CollectionFilterSelect
            value={value.finish}
            placeholder="Finish"
            options={options.finishes}
            className={controlClassName}
            onChange={(finish) => onChange({ finish })}
          />
          <CollectionFilterSelect
            value={value.language}
            placeholder="Language"
            options={options.languages}
            className={controlClassName}
            onChange={(language) => onChange({ language })}
          />
          <CollectionFilterSelect
            value={value.missingDetails ? 'missing' : ''}
            placeholder="Details"
            options={detailOptions}
            className={controlClassName}
            onChange={(details) => onChange({ missingDetails: details === 'missing' })}
          />
        </div>
        <div className="flex items-center justify-between gap-2 lg:justify-end">
          {activeFilterCount ? <Badge variant="secondary">{activeFilterCount} active</Badge> : null}
          <Button
            type="button"
            variant="outline"
            className={cn(controlClassName, 'px-4')}
            onClick={onReset}
            disabled={!activeFilterCount}
          >
            <RotateCcw data-icon="inline-start" />
            Reset
          </Button>
        </div>
      </div>
    </section>
  );
}
