'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, type LinkageConfidenceBand, type LinkageStatus } from '@repo/shared';
import { pokemonApi } from '@/lib/pokemon/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

const statusOptions: { value: 'all' | LinkageStatus; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'auto_linked', label: 'Auto linked' },
  { value: 'needs_review', label: 'Needs review' },
  { value: 'unlinked', label: 'Unlinked' },
  { value: 'rejected', label: 'Rejected' },
];

const confidenceOptions: { value: 'all' | LinkageConfidenceBand; label: string }[] = [
  { value: 'all', label: 'All confidence' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const getCardmarketProductUrl = (idProduct: number): string =>
  `https://www.cardmarket.com/Pokemon/Products?idProduct=${idProduct}`;

const formatMetadataValue = (value: unknown): string => {
  if (value === null || value === undefined) return '-';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
  return String(value);
};

export default function LinkagePage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | LinkageStatus>('all');
  const [confidenceBand, setConfidenceBand] = useState<'all' | LinkageConfidenceBand>('all');
  const [page, setPage] = useState(1);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [manualCardId, setManualCardId] = useState('');
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [productsFile, setProductsFile] = useState<File | null>(null);
  const [pricesFile, setPricesFile] = useState<File | null>(null);
  const [fileImportError, setFileImportError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      query,
      page,
      pageSize: 25,
      ...(status !== 'all' ? { status } : {}),
      ...(confidenceBand !== 'all' ? { confidenceBand } : {}),
      sortBy: 'updatedAt' as const,
      sortOrder: 'desc' as const,
    }),
    [confidenceBand, page, query, status],
  );

  const summaryQuery = useQuery({ queryKey: queryKeys.linkage.summary(), queryFn: pokemonApi.linkageSummary });
  const itemsQuery = useQuery({ queryKey: queryKeys.linkage.list(filters), queryFn: () => pokemonApi.linkageItems(filters) });
  const importStatusQuery = useQuery({
    queryKey: ['linkage.import.status', importJobId],
    queryFn: () => pokemonApi.linkageImportStatus(importJobId as string),
    enabled: Boolean(importJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 1000;
    },
  });

  const refreshLinkageQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.linkage.summary() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.linkage.list(filters) }),
    ]);
  }, [filters, queryClient]);

  const importMutation = useMutation({
    mutationFn: pokemonApi.linkageImport,
    onSuccess: (result) => {
      setImportJobId(result.jobId);
    },
  });

  const fileImportMutation = useMutation({
    mutationFn: async (mode: 'prices' | 'products') => {
      const parseJson = async (file: File) => JSON.parse(await file.text()) as Record<string, unknown>;

      if (mode === 'prices') {
        if (!pricesFile) throw new Error('Select a price guide JSON file first.');
        const pricesJson = await parseJson(pricesFile);
        const createdAt = typeof pricesJson.createdAt === 'string' ? pricesJson.createdAt.trim() : '';
        if (!createdAt) {
          throw new Error('Price guide file is missing top-level "createdAt".');
        }
        const parsedDate = new Date(createdAt);
        if (Number.isNaN(parsedDate.getTime())) {
          throw new Error(`Price guide "createdAt" is invalid: "${createdAt}".`);
        }
        const priceGuides = Array.isArray(pricesJson.priceGuides) ? pricesJson.priceGuides : [];
        if (priceGuides.length === 0) {
          throw new Error('Price guide file is missing a non-empty "priceGuides" array.');
        }
        return pokemonApi.linkageImportUpload({ createdAt, priceGuides });
      }

      if (!productsFile) throw new Error('Select a products catalog JSON file first.');
      const productsJson = await parseJson(productsFile);
      const products = Array.isArray(productsJson.products) ? productsJson.products : [];
      if (products.length === 0) {
        throw new Error('Products file is missing a non-empty "products" array.');
      }
      return pokemonApi.linkageImportUpload({ products });
    },
    onSuccess: (result) => {
      setFileImportError(null);
      setImportJobId(result.jobId);
    },
    onError: (error) => {
      setFileImportError(error instanceof Error ? error.message : 'Import failed.');
    },
  });

  useEffect(() => {
    const status = importStatusQuery.data?.status;
    if (status === 'completed') {
      void refreshLinkageQueries();
    }
  }, [importStatusQuery.data?.status, refreshLinkageQueries]);

  const approveMutation = useMutation({
    mutationFn: (id: string) => pokemonApi.linkageApprove(id),
    onSuccess: refreshLinkageQueries,
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => pokemonApi.linkageReject(id),
    onSuccess: refreshLinkageQueries,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pokemonApi.linkageDelete(id),
    onSuccess: refreshLinkageQueries,
  });

  const resetMutation = useMutation({
    mutationFn: () => pokemonApi.linkageReset(),
    onSuccess: refreshLinkageQueries,
  });

  const manualLinkMutation = useMutation({
    mutationFn: ({ id, cardId }: { id: string; cardId: string }) => pokemonApi.linkageManualLink(id, cardId),
    onSuccess: async () => {
      setSelectedLinkId(null);
      setManualCardId('');
      await refreshLinkageQueries();
    },
  });

  const summary = summaryQuery.data?.data;
  const items = itemsQuery.data?.data ?? [];
  const importJob = importStatusQuery.data;
  const importInProgress = importJob?.status === 'queued' || importJob?.status === 'running';

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Linkage Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage Cardmarket product links to Pokemon cards.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger className="inline-flex h-10 items-center justify-center rounded-md border border-destructive/30 bg-background px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10">
              Remove All Linkings
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Remove all linkings?</DialogTitle>
                <DialogDescription>
                  This will delete every link between Cardmarket products and Pokemon cards. Products and price guides stay imported.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter showCloseButton>
                <Button
                  variant="destructive"
                  disabled={resetMutation.isPending}
                  onClick={() => resetMutation.mutate()}
                >
                  {resetMutation.isPending ? 'Removing...' : 'Yes, remove all'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            href="/linkage/products"
          >
            View Products
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            href="/linkage/set-mappings"
          >
            Set Mappings
          </Link>
          <Button onClick={() => importMutation.mutate()} disabled={importMutation.isPending || importInProgress}>
            {importInProgress ? 'Import Running...' : importMutation.isPending ? 'Starting...' : 'Run Import'}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <div className="mb-3">
          <h2 className="text-sm font-semibold">Import From JSON Files</h2>
          <p className="text-xs text-muted-foreground">
            Upload Cardmarket exports from your machine. Price and products imports are independent.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Price Guides JSON</label>
            <Input type="file" accept="application/json,.json" onChange={(event) => setPricesFile(event.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Products JSON (optional)</label>
            <Input type="file" accept="application/json,.json" onChange={(event) => setProductsFile(event.target.files?.[0] ?? null)} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            onClick={() => fileImportMutation.mutate('prices')}
            disabled={fileImportMutation.isPending || importInProgress || !pricesFile}
          >
            {fileImportMutation.isPending ? 'Uploading...' : 'Import Price Guide JSON'}
          </Button>
          <Button
            variant="outline"
            onClick={() => fileImportMutation.mutate('products')}
            disabled={fileImportMutation.isPending || importInProgress || !productsFile}
          >
            {fileImportMutation.isPending ? 'Uploading...' : 'Import Products Catalog JSON'}
          </Button>
          {pricesFile ? <Badge variant="secondary">{pricesFile.name}</Badge> : null}
          {productsFile ? <Badge variant="outline">{productsFile.name}</Badge> : null}
        </div>
        {fileImportError ? <p className="mt-2 text-xs text-destructive">{fileImportError}</p> : null}
      </div>

      {importJob ? (
        <div className="rounded-xl border p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Import Status: {importJob.status}</span>
            <span className="text-muted-foreground">{importJob.progressPct}%</span>
          </div>
          <Progress value={importJob.progressPct} className="h-2" />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Processed: {importJob.processed}/{importJob.total || 0}</span>
            <span>Updated: {importJob.updated}</span>
            <span>Failed: {importJob.failed}</span>
            {importJob.error ? <span className="text-destructive">Error: {importJob.error}</span> : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-semibold">{summary?.total ?? 0}</p></div>
        <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Auto Linked</p><p className="text-xl font-semibold">{summary?.status.auto_linked ?? 0}</p></div>
        <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Needs Review</p><p className="text-xl font-semibold">{summary?.status.needs_review ?? 0}</p></div>
        <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Unlinked</p><p className="text-xl font-semibold">{summary?.status.unlinked ?? 0}</p></div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search product, card, or idProduct"
          value={query}
          onChange={(event) => {
            setPage(1);
            setQuery(event.target.value);
          }}
          className="max-w-md"
        />
        <Select value={status} onValueChange={(value) => { setPage(1); setStatus(value as 'all' | LinkageStatus); }}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>{statusOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={confidenceBand} onValueChange={(value) => { setPage(1); setConfidenceBand(value as 'all' | LinkageConfidenceBand); }}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>{confidenceOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Linked Card</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Confidence</th>
              <th className="px-3 py-2 font-medium">Trend</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-3 py-2">
                  <div className="font-medium">{item.product.name}</div>
                  <div className="text-xs text-muted-foreground">idProduct: {item.idProduct}</div>
                </td>
                <td className="px-3 py-2">
                  {item.card ? (
                    <div className="flex items-center gap-2">
                      {item.card.imageSmall ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={item.card.name}
                          className="h-10 w-8 rounded-sm border object-cover"
                          src={item.card.imageSmall}
                        />
                      ) : null}
                      <div className="min-w-0">
                        <div className="truncate">{item.card.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{item.card.id} - {item.card.setName}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not linked</span>
                  )}
                </td>
                <td className="px-3 py-2"><Badge variant="secondary">{item.status}</Badge></td>
                <td className="px-3 py-2">{item.confidenceBand ?? '-'}</td>
                <td className="px-3 py-2">{item.priceGuide?.trend ?? '-'}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <Dialog>
                      <DialogTrigger className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium hover:bg-muted">
                        Review
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] max-w-none overflow-visible sm:max-w-none lg:w-[1200px]">
                        <DialogHeader><DialogTitle>Link Review</DialogTitle></DialogHeader>
                        <div className="grid gap-5 md:grid-cols-2">
                          <div className="rounded-lg border p-4">
                            <h3 className="mb-2 text-sm font-semibold">Cardmarket Product</h3>
                            <p className="text-sm font-medium">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">idProduct: {item.idProduct}</p>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              {[
                                ['idCategory', item.product.idCategory],
                                ['categoryName', item.product.categoryName],
                                ['idExpansion', item.product.idExpansion],
                                ['idMetacard', item.product.idMetacard],
                                ['dateAdded', item.product.dateAdded],
                              ].map(([label, value]) => (
                                <div key={label} className="rounded border p-2">
                                  <div className="text-muted-foreground">{label}</div>
                                  <div className="font-medium">{formatMetadataValue(value)}</div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                              {[
                                ['trend', item.priceGuide?.trend],
                                ['avg', item.priceGuide?.avg],
                                ['low', item.priceGuide?.low],
                                ['avg1', item.priceGuide?.avg1],
                                ['avg7', item.priceGuide?.avg7],
                                ['avg30', item.priceGuide?.avg30],
                                ['avgHolo', item.priceGuide?.avgHolo],
                                ['lowHolo', item.priceGuide?.lowHolo],
                                ['trendHolo', item.priceGuide?.trendHolo],
                                ['avg1Holo', item.priceGuide?.avg1Holo],
                                ['avg7Holo', item.priceGuide?.avg7Holo],
                                ['avg30Holo', item.priceGuide?.avg30Holo],
                                ['idCategory', item.priceGuide?.idCategory],
                              ].map(([label, value]) => (
                                <div key={label} className="rounded border p-2">
                                  <div className="text-muted-foreground">{label}</div>
                                  <div className="font-medium">{formatMetadataValue(value)}</div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              {[
                                ['status', item.status],
                                ['confidenceBand', item.confidenceBand],
                                ['score', item.score],
                                ['provenance', item.provenance],
                                ['updatedAt', item.updatedAt],
                              ].map(([label, value]) => (
                                <div key={label} className="rounded border p-2">
                                  <div className="text-muted-foreground">{label}</div>
                                  <div className="font-medium">{formatMetadataValue(value)}</div>
                                </div>
                              ))}
                            </div>
                            <a
                              className="mt-3 inline-flex text-sm text-primary underline underline-offset-4"
                              href={getCardmarketProductUrl(item.idProduct)}
                              rel="noreferrer"
                              target="_blank"
                            >
                              Open on Cardmarket
                            </a>
                          </div>
                          <div className="rounded-lg border p-4">
                            <h3 className="mb-2 text-sm font-semibold">Linked Pokemon Card</h3>
                            {item.card ? (
                              <div className="space-y-2">
                                <div className="flex gap-3">
                                  {item.card.imageSmall ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      alt={item.card.name}
                                      className="h-36 w-24 rounded border object-cover"
                                      src={item.card.imageSmall}
                                    />
                                  ) : null}
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium">{item.card.name}</p>
                                    <p className="text-xs text-muted-foreground">Card ID: {item.card.id}</p>
                                    <p className="text-xs text-muted-foreground">Set: {item.card.setName}</p>
                                  </div>
                                </div>
                                <Link
                                  className="inline-flex text-sm text-primary underline underline-offset-4"
                                  href={`/cards/${item.card.id}`}
                                  target="_blank"
                                >
                                  Open card in app
                                </Link>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                  {[
                                    ['id', item.card.id],
                                    ['name', item.card.name],
                                    ['supertype', item.card.supertype],
                                    ['subtypes', item.card.subtypes],
                                    ['hp', item.card.hp],
                                    ['types', item.card.types],
                                    ['setId', item.card.setId],
                                    ['setName', item.card.setName],
                                    ['rarity', item.card.rarity],
                                    ['imageSmall', item.card.imageSmall],
                                    ['imageLarge', item.card.imageLarge],
                                  ].map(([label, value]) => (
                                    <div key={String(label)} className="rounded border p-2">
                                      <div className="text-muted-foreground">{label}</div>
                                      <div className="break-all font-medium">{formatMetadataValue(value)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No card linked yet.</p>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="outline" onClick={() => approveMutation.mutate(item.id)}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate(item.id)}>Reject</Button>
                    <Dialog open={selectedLinkId === item.id} onOpenChange={(open) => setSelectedLinkId(open ? item.id : null)}>
                      <DialogTrigger className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium hover:bg-muted">
                        Manual Link
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Manual Link</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Search cards on the Cards page, copy card ID, then set it here.
                          </p>
                          <Input placeholder="Card ID (e.g. sv8pt5-64)" value={manualCardId} onChange={(e) => setManualCardId(e.target.value)} />
                          <Button
                            className="w-full"
                            disabled={!manualCardId || manualLinkMutation.isPending}
                            onClick={() => manualLinkMutation.mutate({ id: item.id, cardId: manualCardId })}
                          >
                            Save manual link
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(item.id)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-muted-foreground" colSpan={6}>No linkage items found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {itemsQuery.data?.count ?? 0} of {itemsQuery.data?.totalCount ?? 0}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={(itemsQuery.data?.count ?? 0) < (itemsQuery.data?.pageSize ?? 25)}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
