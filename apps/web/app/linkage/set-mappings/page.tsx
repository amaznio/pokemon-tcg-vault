'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  queryKeys,
  type CardmarketSetMappingConfidence,
  type CardmarketSetMappingInput,
  type CardmarketSetMappingItem,
} from '@repo/shared';
import { pokemonApi } from '@/lib/pokemon/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const confidenceOptions: { value: 'all' | CardmarketSetMappingConfidence; label: string }[] = [
  { value: 'all', label: 'All confidence' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

type MappingFormState = {
  ourSetId: string;
  cardmarketSetCode: string;
  cardmarketSetSlug: string;
  cardmarketIdExpansion: string;
  confidence: CardmarketSetMappingConfidence;
  source: string;
};

const emptyForm: MappingFormState = {
  ourSetId: '',
  cardmarketSetCode: '',
  cardmarketSetSlug: '',
  cardmarketIdExpansion: '',
  confidence: 'high',
  source: 'manual',
};

const toFormState = (mapping: CardmarketSetMappingItem): MappingFormState => ({
  ourSetId: mapping.ourSetId,
  cardmarketSetCode: mapping.cardmarketSetCode ?? '',
  cardmarketSetSlug: mapping.cardmarketSetSlug ?? '',
  cardmarketIdExpansion: mapping.cardmarketIdExpansion?.toString() ?? '',
  confidence: mapping.confidence,
  source: mapping.source,
});

const toPayload = (form: MappingFormState): CardmarketSetMappingInput => ({
  ourSetId: form.ourSetId.trim(),
  cardmarketSetCode: form.cardmarketSetCode.trim() || null,
  cardmarketSetSlug: form.cardmarketSetSlug.trim() || null,
  cardmarketIdExpansion: form.cardmarketIdExpansion.trim() ? Number(form.cardmarketIdExpansion) : null,
  confidence: form.confidence,
  source: form.source.trim() || 'manual',
});

function MappingDialog({
  mapping,
  onSubmit,
  pending,
}: {
  mapping?: CardmarketSetMappingItem;
  onSubmit: (payload: CardmarketSetMappingInput) => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MappingFormState>(mapping ? toFormState(mapping) : emptyForm);

  const updateField = (field: keyof MappingFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setForm(mapping ? toFormState(mapping) : emptyForm);
      }}
    >
      <DialogTrigger
        className={
          mapping
            ? 'inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium hover:bg-muted'
            : 'inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
        }
      >
        {mapping ? 'Edit' : 'Add Mapping'}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mapping ? 'Edit set mapping' : 'Add set mapping'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-xs text-muted-foreground">Pokemon set ID</span>
            <Input placeholder="sv10" value={form.ourSetId} onChange={(event) => updateField('ourSetId', event.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-muted-foreground">Cardmarket set code</span>
            <Input placeholder="DRI" value={form.cardmarketSetCode} onChange={(event) => updateField('cardmarketSetCode', event.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-muted-foreground">Cardmarket set slug</span>
            <Input placeholder="Destined-Rivals" value={form.cardmarketSetSlug} onChange={(event) => updateField('cardmarketSetSlug', event.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-muted-foreground">Cardmarket idExpansion</span>
            <Input
              inputMode="numeric"
              placeholder="Expansion ID"
              value={form.cardmarketIdExpansion}
              onChange={(event) => updateField('cardmarketIdExpansion', event.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-muted-foreground">Confidence</span>
            <Select value={form.confidence} onValueChange={(value) => updateField('confidence', value ?? 'high')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs text-muted-foreground">Source</span>
            <Input value={form.source} onChange={(event) => updateField('source', event.target.value)} />
          </label>
        </div>
        <Button
          disabled={pending || !form.ourSetId.trim()}
          onClick={() => {
            onSubmit(toPayload(form));
            setOpen(false);
          }}
        >
          {pending ? 'Saving...' : 'Save mapping'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default function LinkageSetMappingsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [confidence, setConfidence] = useState<'all' | CardmarketSetMappingConfidence>('all');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'ourSetId' | 'confidence' | 'evidenceCount'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filters = useMemo(
    () => ({
      query,
      page,
      pageSize: 50,
      ...(confidence !== 'all' ? { confidence } : {}),
      sortBy,
      sortOrder,
    }),
    [confidence, page, query, sortBy, sortOrder],
  );

  const mappingsQuery = useQuery({
    queryKey: queryKeys.linkage.setMappings(filters),
    queryFn: () => pokemonApi.linkageSetMappings(filters),
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.linkage.setMappings(filters) });
  };

  const upsertMutation = useMutation({
    mutationFn: pokemonApi.linkageSetMappingUpsert,
    onSuccess: refresh,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CardmarketSetMappingInput> }) =>
      pokemonApi.linkageSetMappingUpdate(id, payload),
    onSuccess: refresh,
  });

  const deleteMutation = useMutation({
    mutationFn: pokemonApi.linkageSetMappingDelete,
    onSuccess: refresh,
  });

  const mappings = mappingsQuery.data?.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Set Mappings</h1>
          <p className="text-sm text-muted-foreground">Map Pokemon set IDs to Cardmarket expansion identifiers.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            href="/linkage"
          >
            Linkage Dashboard
          </Link>
          <MappingDialog pending={upsertMutation.isPending} onSubmit={(payload) => upsertMutation.mutate(payload)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search set ID, set code, slug, or idExpansion"
          value={query}
          onChange={(event) => {
            setPage(1);
            setQuery(event.target.value);
          }}
          className="max-w-md"
        />
        <Select value={confidence} onValueChange={(value) => { setPage(1); setConfidence(value as 'all' | CardmarketSetMappingConfidence); }}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>{confidenceOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
          <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="updatedAt">Sort: Updated</SelectItem>
            <SelectItem value="ourSetId">Sort: Set ID</SelectItem>
            <SelectItem value="confidence">Sort: Confidence</SelectItem>
            <SelectItem value="evidenceCount">Sort: Evidence</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Desc</SelectItem>
            <SelectItem value="asc">Asc</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Pokemon Set</th>
              <th className="px-3 py-2 font-medium">Cardmarket</th>
              <th className="px-3 py-2 font-medium">Confidence</th>
              <th className="px-3 py-2 font-medium">Evidence</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Updated</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((mapping) => (
              <tr key={mapping.id} className="border-t align-top">
                <td className="px-3 py-2 font-mono">{mapping.ourSetId}</td>
                <td className="px-3 py-2">
                  <div>Code: <span className="font-mono">{mapping.cardmarketSetCode ?? '-'}</span></div>
                  <div>Slug: <span className="font-mono">{mapping.cardmarketSetSlug ?? '-'}</span></div>
                  <div>idExpansion: <span className="font-mono">{mapping.cardmarketIdExpansion ?? '-'}</span></div>
                </td>
                <td className="px-3 py-2"><Badge variant="secondary">{mapping.confidence}</Badge></td>
                <td className="px-3 py-2">
                  <div>evidence: {mapping.evidenceCount}</div>
                  <div className="text-xs text-muted-foreground">conflicts: {mapping.conflictCount}</div>
                  <div className="text-xs text-muted-foreground">last score: {mapping.lastScore ?? '-'}</div>
                </td>
                <td className="px-3 py-2">{mapping.source}</td>
                <td className="px-3 py-2">{new Date(mapping.updatedAt).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <MappingDialog
                      mapping={mapping}
                      pending={updateMutation.isPending}
                      onSubmit={(payload) => updateMutation.mutate({ id: mapping.id, payload })}
                    />
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(mapping.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {mappings.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-muted-foreground" colSpan={7}>No set mappings found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {mappingsQuery.data?.count ?? 0} of {mappingsQuery.data?.totalCount ?? 0}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={(mappingsQuery.data?.count ?? 0) < (mappingsQuery.data?.pageSize ?? 50)}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
