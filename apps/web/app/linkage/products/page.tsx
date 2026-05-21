'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@repo/shared';
import { pokemonApi } from '@/lib/pokemon/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const getCardmarketProductUrl = (idProduct: number): string =>
  `https://www.cardmarket.com/Pokemon/Products?idProduct=${idProduct}`;

function CardImagePreview({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="grid h-14 w-10 shrink-0 place-items-center rounded border bg-muted/40 text-[10px] text-muted-foreground">
        No img
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger className="block h-14 w-10 shrink-0 overflow-hidden rounded border bg-muted hover:ring-2 hover:ring-primary/30">
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </TooltipTrigger>
      <TooltipContent side="right" align="start" className="max-w-none bg-background p-2 text-foreground shadow-lg ring-1 ring-border [&>svg]:hidden">
        <img src={src} alt={alt} className="h-80 rounded-md object-contain" />
      </TooltipContent>
    </Tooltip>
  );
}

function SuggestedLinksDialog({ idProduct }: { idProduct: number }) {
  const [open, setOpen] = useState(false);
  const [linkedCardId, setLinkedCardId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const suggestionsQuery = useQuery({
    queryKey: queryKeys.linkage.productSuggestions(idProduct, 8),
    queryFn: () => pokemonApi.linkageProductSuggestions(idProduct, 8),
    enabled: open,
  });
  const linkMutation = useMutation({
    mutationFn: (cardId: string) => pokemonApi.linkageManualLinkProduct(idProduct, cardId),
    onSuccess: async (_data, cardId) => {
      setLinkedCardId(cardId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['linkage.products'] }),
        queryClient.invalidateQueries({ queryKey: ['linkage.list'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.linkage.productSuggestions(idProduct, 8) }),
      ]);
    },
  });

  const suggestions = suggestionsQuery.data?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium hover:bg-muted">
        Suggested Links
      </DialogTrigger>
      <DialogContent className="grid h-[86vh] w-[96vw] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-none lg:max-w-none xl:max-w-none">
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <div className="space-y-1">
            <DialogTitle>Suggested cards for product #{idProduct}</DialogTitle>
            <p className="text-xs text-muted-foreground">
              {suggestionsQuery.data?.mappedSetId ? `Mapped set: ${suggestionsQuery.data.mappedSetId}` : 'Top candidate cards by name and set signals'}
            </p>
          </div>
        </DialogHeader>
        <div className="min-h-0 overflow-auto p-6">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[760px] table-fixed text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="w-[34%] px-3 py-2 font-medium">Card</th>
                  <th className="w-[24%] px-3 py-2 font-medium">Set</th>
                  <th className="w-[10%] px-3 py-2 font-medium">Score</th>
                  <th className="w-[18%] px-3 py-2 font-medium">Reason</th>
                  <th className="w-[14%] px-3 py-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map((item) => {
                  const isCurrentMutation = linkMutation.isPending && linkMutation.variables === item.card.id;
                  const isLinked = linkedCardId === item.card.id;
                  return (
                    <tr key={item.card.id} className="border-t">
                      <td className="px-3 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <CardImagePreview src={item.card.imageSmall ?? item.card.imageLarge} alt={item.card.name} />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{item.card.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{item.card.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="truncate px-3 py-3">{item.card.setName}</td>
                      <td className="px-3 py-3 font-mono">{item.score.toFixed(3)}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex max-w-full truncate rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                          {item.reason}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="h-8 min-w-[68px] text-xs"
                            disabled={linkMutation.isPending || isLinked}
                            onClick={() => linkMutation.mutate(item.card.id)}
                          >
                            {isLinked ? 'Linked' : isCurrentMutation ? 'Linking' : 'Link'}
                          </Button>
                          <Link
                            className="inline-flex h-8 min-w-[88px] items-center justify-center rounded-md border px-3 text-xs font-medium hover:bg-muted"
                            href={`/cards/${item.card.id}`}
                            target="_blank"
                          >
                            Open Card
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!suggestions.length && !suggestionsQuery.isLoading ? (
                  <tr>
                    <td className="px-3 py-10 text-center text-muted-foreground" colSpan={5}>
                      No suggested cards found.
                    </td>
                  </tr>
                ) : null}
                {suggestionsQuery.isLoading ? (
                  <tr>
                    <td className="px-3 py-10 text-center text-muted-foreground" colSpan={5}>
                      Loading suggestions...
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {linkMutation.isError ? (
            <p className="mt-3 text-sm text-destructive">
              {linkMutation.error instanceof Error ? linkMutation.error.message : 'Unable to link this product.'}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LinkageProductsPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'updatedAt' | 'idProduct' | 'name'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filters = useMemo(
    () => ({
      query,
      page,
      pageSize: 50,
      sortBy,
      sortOrder,
    }),
    [page, query, sortBy, sortOrder],
  );

  const productsQuery = useQuery({
    queryKey: queryKeys.linkage.products(filters),
    queryFn: () => pokemonApi.linkageProducts(filters),
  });

  const products = productsQuery.data?.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cardmarket Products</h1>
          <p className="text-sm text-muted-foreground">Full product data imported from Cardmarket with pricing and linkage status.</p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          href="/linkage/set-mappings"
        >
          Set Mappings
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name, category, idProduct, idExpansion, idMetacard"
          value={query}
          onChange={(event) => {
            setPage(1);
            setQuery(event.target.value);
          }}
          className="max-w-xl"
        />
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'updatedAt' | 'idProduct' | 'name')}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="updatedAt">Sort: Updated</SelectItem>
            <SelectItem value="idProduct">Sort: idProduct</SelectItem>
            <SelectItem value="name">Sort: Name</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Desc</SelectItem>
            <SelectItem value="asc">Asc</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[1400px] text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">idProduct</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">idExpansion</th>
              <th className="px-3 py-2 font-medium">idMetacard</th>
              <th className="px-3 py-2 font-medium">dateAdded</th>
              <th className="px-3 py-2 font-medium">Price (trend/avg/low)</th>
              <th className="px-3 py-2 font-medium">Linkage</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.idProduct} className="border-t align-top">
                <td className="px-3 py-2 font-mono">{product.idProduct}</td>
                <td className="px-3 py-2">{product.name}</td>
                <td className="px-3 py-2">
                  <div>{product.categoryName ?? '-'}</div>
                  <div className="text-xs text-muted-foreground">idCategory: {product.idCategory ?? '-'}</div>
                </td>
                <td className="px-3 py-2 font-mono">{product.idExpansion ?? '-'}</td>
                <td className="px-3 py-2 font-mono">{product.idMetacard ?? '-'}</td>
                <td className="px-3 py-2">{product.dateAdded ?? '-'}</td>
                <td className="px-3 py-2">
                  {product.priceGuide ? (
                    <div>
                      <div>trend: {product.priceGuide.trend ?? '-'}</div>
                      <div>avg: {product.priceGuide.avg ?? '-'}</div>
                      <div>low: {product.priceGuide.low ?? '-'}</div>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-3 py-2">
                  {product.link ? (
                    <div>
                      <div>{product.link.status}</div>
                      <div className="text-xs text-muted-foreground">score: {product.link.score ?? '-'}</div>
                      <div className="text-xs text-muted-foreground">cardId: {product.link.cardId ?? '-'}</div>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <a
                      className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium hover:bg-muted"
                      href={getCardmarketProductUrl(product.idProduct)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open CM
                    </a>
                    <Dialog>
                      <DialogTrigger className="inline-flex h-8 items-center justify-center rounded-md border px-3 text-xs font-medium hover:bg-muted">
                        Raw JSON
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] max-w-6xl">
                        <DialogHeader>
                          <DialogTitle>Cardmarket Product #{product.idProduct}</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[70vh] overflow-auto rounded-md border bg-muted/20 p-3">
                          <pre className="text-xs">{JSON.stringify(product, null, 2)}</pre>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <SuggestedLinksDialog idProduct={product.idProduct} />
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-muted-foreground" colSpan={9}>
                  No products found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {productsQuery.data?.count ?? 0} of {productsQuery.data?.totalCount ?? 0}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={(productsQuery.data?.count ?? 0) < (productsQuery.data?.pageSize ?? 50)}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
