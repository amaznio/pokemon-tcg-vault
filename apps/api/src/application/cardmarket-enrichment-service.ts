import type { Card } from '@prisma/client';
import { env } from '../infrastructure/env';
import { prisma } from '../infrastructure/prisma';
import { getCardSignals, parseCardmarketRedirectUrl, scoreCardmarketCandidate } from './cardmarket-matching-service';

const db = prisma as any;

type EnrichmentState = 'idle' | 'matching' | 'matched' | 'unresolved' | 'error';

type CardmarketDetailState = {
  enrichmentState: EnrichmentState;
  statusMessage?: string;
  mapping: {
    idProduct: number;
    status: 'auto_linked' | 'needs_review' | 'unlinked' | 'rejected';
    score: number | null;
    confidenceBand: 'high' | 'medium' | 'low' | null;
    matchMethod: string | null;
    finalUrl: string | null;
  } | null;
  priceGuide: {
    avg: number | null;
    low: number | null;
    trend: number | null;
    avg1: number | null;
    avg7: number | null;
    avg30: number | null;
    avgHolo: number | null;
    lowHolo: number | null;
    trendHolo: number | null;
    avg1Holo: number | null;
    avg7Holo: number | null;
    avg30Holo: number | null;
    updatedAt: string | null;
  } | null;
  priceHistory: Array<{
    snapshotDate: string;
    avg: number | null;
    low: number | null;
    trend: number | null;
    avg1: number | null;
    avg7: number | null;
    avg30: number | null;
    avgHolo: number | null;
    lowHolo: number | null;
    trendHolo: number | null;
    avg1Holo: number | null;
    avg7Holo: number | null;
    avg30Holo: number | null;
  }>;
};

type SetMappingConfidence = 'low' | 'medium' | 'high';

const nowPlusMinutes = (minutes: number) => new Date(Date.now() + minutes * 60_000);

const scoreToBand = (score: number | null): 'high' | 'medium' | 'low' | null => {
  if (score === null || Number.isNaN(score)) return null;
  if (score >= 0.85) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
};

const extractLocation = (response: Response): string | null => {
  const location = response.headers.get('location');
  return location && location.trim() ? location : null;
};

const resolveRedirectLocation = (currentUrl: string, location: string): string => {
  try {
    return new URL(location, currentUrl).toString();
  } catch {
    return location;
  }
};

const fetchRedirectedUrl = async (idProduct: number): Promise<{ finalUrl: string | null; status: 'success' | 'failed' | 'forbidden' | 'rate_limited'; error: string | null }> => {
  const timeout = env.CARDMARKET_ENRICHMENT_REQUEST_TIMEOUT_MS;
  const redirectLimit = env.CARDMARKET_ENRICHMENT_REDIRECT_LIMIT;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    let currentUrl = `https://www.cardmarket.com/Pokemon/Products?idProduct=${idProduct}`;

    for (let step = 0; step < redirectLimit; step += 1) {
      const response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'user-agent': 'pokemon-tcg-app/1.0',
          accept: 'text/html,application/xhtml+xml',
        },
      });

      if (response.status === 403) return { finalUrl: null, status: 'forbidden', error: '403 forbidden' };
      if (response.status === 429) return { finalUrl: null, status: 'rate_limited', error: '429 rate limited' };

      if (response.status >= 300 && response.status < 400) {
        const location = extractLocation(response);
        if (!location) return { finalUrl: null, status: 'failed', error: 'redirect without location' };
        currentUrl = resolveRedirectLocation(currentUrl, location);
        continue;
      }

      if (!response.ok) {
        return { finalUrl: null, status: 'failed', error: `status ${response.status}` };
      }

      return { finalUrl: response.url || currentUrl, status: 'success', error: null };
    }

    return { finalUrl: null, status: 'failed', error: 'redirect limit reached' };
  } catch (error) {
    return {
      finalUrl: null,
      status: 'failed',
      error: error instanceof Error ? error.message : 'unknown fetch error',
    };
  } finally {
    clearTimeout(timer);
  }
};

const normalizeToken = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '');

const parseCardIdSignals = (cardId: string): { setToken: string | null; collectorToken: string | null } => {
  const match = cardId.match(/^([a-z0-9]+)-([a-z0-9]+)$/i);
  if (!match) return { setToken: null, collectorToken: null };
  return {
    setToken: normalizeToken(match[1] ?? ''),
    collectorToken: normalizeToken(match[2] ?? ''),
  };
};

const candidateNameTokens = (card: Card): string[] => {
  const raw = (card.raw ?? {}) as Record<string, unknown>;
  const rawCollector = typeof raw.number === 'string' ? normalizeToken(raw.number) : null;
  const rawSet = (raw.set ?? {}) as Record<string, unknown>;
  const rawSetId = typeof rawSet.id === 'string' ? normalizeToken(rawSet.id) : null;
  const idSignals = parseCardIdSignals(card.id);

  const nameTokens = card.name
    .replace(/\[[^\]]*\]/g, '')
    .split(/\s+/)
    .map((token) => normalizeToken(token.trim()))
    .filter((token) => token.length >= 3)
    .slice(0, 5);

  const setNameTokens = (card.setName ?? '')
    .split(/\s+/)
    .map((token) => normalizeToken(token))
    .filter((token) => token.length >= 3)
    .slice(0, 3);

  const setCompositeToken = normalizeToken(card.setName ?? '');

  const extraTokens = [rawCollector, idSignals.collectorToken, idSignals.setToken, rawSetId, setCompositeToken, ...setNameTokens].filter(
    (token): token is string => Boolean(token && token.length >= 2),
  );

  return [...new Set([...nameTokens, ...extraTokens])];
};

const normalizedIncludesAnyToken = (value: string, tokens: string[]): boolean => {
  const normalized = normalizeToken(value);
  return tokens.some((token) => normalized.includes(token));
};

const tokenOverlapScore = (value: string, tokens: string[]): number => {
  const normalized = normalizeToken(value);
  return tokens.filter((token) => normalized.includes(token)).length;
};

const setTokenOverlapScore = (candidate: any, setTokens: string[]): number => {
  const nameScore = tokenOverlapScore(candidate?.name ?? '', setTokens);
  const categoryScore = tokenOverlapScore(candidate?.categoryName ?? '', setTokens);
  return Math.max(nameScore, categoryScore);
};

const confidenceFromEvidence = (evidenceCount: number): SetMappingConfidence => {
  if (evidenceCount >= 8) return 'high';
  if (evidenceCount >= 4) return 'medium';
  return 'low';
};

const loadSetMapping = async (ourSetId: string) =>
  db.cardmarketSetMapping.findUnique({
    where: { ourSetId },
  });

const toPriceGuideDetail = (priceGuide: any) =>
  priceGuide
    ? {
        avg: priceGuide.avg,
        low: priceGuide.low,
        trend: priceGuide.trend,
        avg1: priceGuide.avg1,
        avg7: priceGuide.avg7,
        avg30: priceGuide.avg30,
        avgHolo: priceGuide.avgHolo,
        lowHolo: priceGuide.lowHolo,
        trendHolo: priceGuide.trendHolo,
        avg1Holo: priceGuide.avg1Holo,
        avg7Holo: priceGuide.avg7Holo,
        avg30Holo: priceGuide.avg30Holo,
        updatedAt: priceGuide.updatedAt?.toISOString?.() ?? null,
      }
    : null;

const toPriceHistoryDetail = (snapshots: any[] = []) =>
  snapshots.map((snapshot) => ({
    snapshotDate: snapshot.snapshotDate.toISOString(),
    avg: snapshot.avg,
    low: snapshot.low,
    trend: snapshot.trend,
    avg1: snapshot.avg1,
    avg7: snapshot.avg7,
    avg30: snapshot.avg30,
    avgHolo: snapshot.avgHolo,
    lowHolo: snapshot.lowHolo,
    trendHolo: snapshot.trendHolo,
    avg1Holo: snapshot.avg1Holo,
    avg7Holo: snapshot.avg7Holo,
    avg30Holo: snapshot.avg30Holo,
  }));

const registerSetMappingEvidence = async ({
  ourSetId,
  cardId,
  parsedSetCode,
  setSlug,
  idExpansion,
  score,
}: {
  ourSetId: string;
  cardId: string;
  parsedSetCode: string | null;
  setSlug: string | null;
  idExpansion: number | null;
  score: number;
}) => {
  if (!parsedSetCode && !setSlug && !idExpansion) return;

  const current = await loadSetMapping(ourSetId);
  const normalizedCode = parsedSetCode?.toUpperCase() ?? null;
  const normalizedSlug = setSlug ?? null;

  if (!current) {
    const evidenceCount = 1;
    await db.cardmarketSetMapping.create({
      data: {
        ourSetId,
        cardmarketSetCode: normalizedCode,
        cardmarketSetSlug: normalizedSlug,
        cardmarketIdExpansion: idExpansion,
        confidence: confidenceFromEvidence(evidenceCount),
        evidenceCount,
        conflictCount: 0,
        lastScore: score,
        lastMatchedCardId: cardId,
      },
    });
    return;
  }

  const codeConflict =
    current.cardmarketSetCode &&
    normalizedCode &&
    current.cardmarketSetCode.toUpperCase() !== normalizedCode.toUpperCase();
  const slugConflict = current.cardmarketSetSlug && normalizedSlug && current.cardmarketSetSlug !== normalizedSlug;
  const expansionConflict = current.cardmarketIdExpansion && idExpansion && current.cardmarketIdExpansion !== idExpansion;

  if (codeConflict || slugConflict || expansionConflict) {
    await db.cardmarketSetMapping.update({
      where: { ourSetId },
      data: {
        conflictCount: { increment: 1 },
        lastScore: score,
        lastMatchedCardId: cardId,
      },
    });
    console.warn('[cardmarket.set-mapping] conflict', {
      ourSetId,
      existingCode: current.cardmarketSetCode,
      incomingCode: normalizedCode,
      existingSlug: current.cardmarketSetSlug,
      incomingSlug: normalizedSlug,
      existingIdExpansion: current.cardmarketIdExpansion,
      incomingIdExpansion: idExpansion,
    });
    return;
  }

  const evidenceCount = current.evidenceCount + 1;
  await db.cardmarketSetMapping.update({
    where: { ourSetId },
    data: {
      cardmarketSetCode: current.cardmarketSetCode ?? normalizedCode,
      cardmarketSetSlug: current.cardmarketSetSlug ?? normalizedSlug,
      cardmarketIdExpansion: current.cardmarketIdExpansion ?? idExpansion,
      evidenceCount,
      confidence: confidenceFromEvidence(evidenceCount),
      lastScore: score,
      lastMatchedCardId: cardId,
    },
  });
};

const findCandidates = async (card: Card) => {
  const tokens = candidateNameTokens(card);
  if (!tokens.length) return [];
  const idSignals = parseCardIdSignals(card.id);
  const collectorToken = idSignals.collectorToken?.toUpperCase() ?? null;
  const cardSignals = getCardSignals(card);
  const mapping = await loadSetMapping(card.setId);
  const setTokens = [
    normalizeToken(cardSignals.setName ?? ''),
    normalizeToken(cardSignals.setCode ?? ''),
    normalizeToken(card.setId),
    normalizeToken(mapping?.cardmarketSetCode ?? ''),
    normalizeToken(mapping?.cardmarketSetSlug ?? ''),
  ].filter((token) => token.length >= 2);

  const candidates = await db.cardmarketProduct.findMany({
    where: {
      AND: [
        {
          OR: [
            ...tokens.map((value) => ({ name: { contains: value, mode: 'insensitive' } })),
            ...(collectorToken ? [{ parsedCollectorNumber: collectorToken }] : []),
        ...(mapping?.cardmarketSetCode ? [{ parsedSetCode: mapping.cardmarketSetCode.toUpperCase() }] : []),
        ...(mapping?.cardmarketSetSlug ? [{ setSlug: { equals: mapping.cardmarketSetSlug, mode: 'insensitive' } }] : []),
        ...(mapping?.cardmarketIdExpansion ? [{ idExpansion: mapping.cardmarketIdExpansion }] : []),
      ],
        },
        {
          OR: [
            { link: { is: null } },
            {
              link: {
                is: {
                  OR: [{ cardId: null }, { cardId: card.id }, { status: 'needs_review' }, { status: 'unlinked' }],
                },
              },
            },
          ],
        },
      ],
    },
    include: {
      link: true,
      priceGuide: true,
    },
    orderBy: [{ updatedAt: 'desc' }],
    take: Math.max(env.CARDMARKET_ENRICHMENT_MAX_CANDIDATES * 6, 60),
  });

  const ranked = candidates
    .filter((candidate: any) => normalizedIncludesAnyToken(candidate.name ?? '', tokens))
    .sort((a: any, b: any) => {
      const setDelta = setTokenOverlapScore(b, setTokens) - setTokenOverlapScore(a, setTokens);
      if (setDelta !== 0) return setDelta;
      return tokenOverlapScore(b.name ?? '', tokens) - tokenOverlapScore(a.name ?? '', tokens);
    });

  const preferredBySet = ranked.filter((candidate: any) => setTokenOverlapScore(candidate, setTokens) > 0);
  const selected = (preferredBySet.length ? preferredBySet : ranked).slice(0, env.CARDMARKET_ENRICHMENT_MAX_CANDIDATES);

  console.info('[cardmarket.enrichment] candidate-ranking', {
    cardId: card.id,
    setId: card.setId,
    setMapping: mapping
      ? {
          code: mapping.cardmarketSetCode,
          slug: mapping.cardmarketSetSlug,
          idExpansion: mapping.cardmarketIdExpansion,
          confidence: mapping.confidence,
          evidenceCount: mapping.evidenceCount,
          conflictCount: mapping.conflictCount,
        }
      : null,
    setTokens,
    ranked: ranked.length,
    preferredBySet: preferredBySet.length,
    selected: selected.length,
  });

  return selected;
};

const enrichProductIfNeeded = async (product: any) => {
  if (product.enrichmentStatus === 'success' && product.finalUrl) return product;
  if (product.nextRetryAt && new Date(product.nextRetryAt).getTime() > Date.now()) return product;

  await db.cardmarketProduct.update({
    where: { idProduct: product.idProduct },
    data: { enrichmentStatus: 'pending' },
  });

  const result = await fetchRedirectedUrl(product.idProduct);
  const nextRetryAt = result.status === 'success' ? null : nowPlusMinutes(env.CARDMARKET_ENRICHMENT_COOLDOWN_MINUTES);

  if (result.status !== 'success' || !result.finalUrl) {
    return db.cardmarketProduct.update({
      where: { idProduct: product.idProduct },
      data: {
        enrichmentStatus: result.status,
        enrichmentError: result.error,
        enrichmentAttempts: { increment: 1 },
        nextRetryAt,
      },
      include: { link: true, priceGuide: true },
    });
  }

  const parsed = parseCardmarketRedirectUrl(result.finalUrl);
  return db.cardmarketProduct.update({
    where: { idProduct: product.idProduct },
    data: {
      finalUrl: parsed.finalUrl,
      setSlug: parsed.setSlug,
      cardSlug: parsed.cardSlug,
      parsedSetCode: parsed.parsedSetCode,
      parsedCollectorNumber: parsed.parsedCollectorNumber,
      enrichmentStatus: 'success',
      enrichmentError: null,
      enrichmentAttempts: { increment: 1 },
      enrichedAt: new Date(),
      nextRetryAt: null,
    },
    include: { link: true, priceGuide: true },
  });
};

export const cardmarketEnrichmentService = {
  async getCardmarketDetail(card: Card): Promise<CardmarketDetailState> {
    console.info('[cardmarket.enrichment] start', {
      cardId: card.id,
      cardName: card.name,
      lazyEnabled: env.CARDMARKET_LAZY_ENRICHMENT_ENABLED,
    });

    const approvedLink = await db.cardLink.findFirst({
      where: {
        cardId: card.id,
        status: 'auto_linked',
        confidenceBand: 'high',
      },
      include: {
        product: {
          include: {
            priceGuide: true,
            priceGuideSnapshots: {
              orderBy: { snapshotDate: 'asc' },
              take: 365,
            },
          },
        },
      },
      orderBy: [{ score: 'desc' }, { updatedAt: 'desc' }],
    });

    if (approvedLink) {
      console.info('[cardmarket.enrichment] approved-link-hit', {
        cardId: card.id,
        idProduct: approvedLink.idProduct,
        score: approvedLink.score,
        confidenceBand: approvedLink.confidenceBand,
        hasPriceGuide: Boolean(approvedLink.product?.priceGuide),
      });
      return {
        enrichmentState: 'matched',
        mapping: {
          idProduct: approvedLink.idProduct,
          status: approvedLink.status,
          score: approvedLink.score,
          confidenceBand: approvedLink.confidenceBand,
          matchMethod: approvedLink.matchMethod,
          finalUrl: approvedLink.product?.finalUrl ?? null,
        },
        priceGuide: toPriceGuideDetail(approvedLink.product?.priceGuide),
        priceHistory: toPriceHistoryDetail(approvedLink.product?.priceGuideSnapshots ?? []),
      };
    }

    if (!env.CARDMARKET_LAZY_ENRICHMENT_ENABLED) {
      console.info('[cardmarket.enrichment] lazy-disabled', { cardId: card.id });
      return {
        enrichmentState: 'idle',
        statusMessage: 'Cardmarket matching is disabled.',
        mapping: null,
        priceGuide: null,
        priceHistory: [],
      };
    }

    const start = Date.now();
    const budgetMs = env.CARDMARKET_ENRICHMENT_TIME_BUDGET_MS;
    const candidates = await findCandidates(card);
    console.info('[cardmarket.enrichment] candidates-found', {
      cardId: card.id,
      candidates: candidates.length,
      budgetMs,
      maxCandidates: env.CARDMARKET_ENRICHMENT_MAX_CANDIDATES,
    });

    if (!candidates.length) {
      console.info('[cardmarket.enrichment] unresolved-no-candidates', { cardId: card.id });
      return {
        enrichmentState: 'unresolved',
        statusMessage: 'No confirmed Cardmarket match yet.',
        mapping: null,
        priceGuide: null,
        priceHistory: [],
      };
    }

    let best: { candidate: any; score: number; method: string; autoApproved: boolean } | null = null;
    let pending = false;

    for (const candidate of candidates) {
      if (Date.now() - start >= budgetMs) {
        pending = true;
        console.info('[cardmarket.enrichment] budget-exhausted', {
          cardId: card.id,
          elapsedMs: Date.now() - start,
          budgetMs,
        });
        break;
      }

      const enriched = await enrichProductIfNeeded(candidate);
      if (enriched.enrichmentStatus === 'pending') pending = true;
      console.info('[cardmarket.enrichment] candidate-enriched', {
        cardId: card.id,
        idProduct: enriched.idProduct,
        enrichmentStatus: enriched.enrichmentStatus,
        hasFinalUrl: Boolean(enriched.finalUrl),
        hasPriceGuide: Boolean(enriched.priceGuide),
      });

      const scored = scoreCardmarketCandidate(card, enriched);
      console.info('[cardmarket.enrichment] candidate-scored', {
        cardId: card.id,
        idProduct: enriched.idProduct,
        score: scored.score,
        method: scored.method,
        autoApproved: scored.autoApproved,
      });
      if (!best || scored.score > best.score) {
        best = {
          candidate: enriched,
          score: scored.score,
          method: scored.method,
          autoApproved: scored.autoApproved,
        };
      }

      if (scored.autoApproved) break;
    }

    if (best) {
      const status = best.autoApproved ? 'auto_linked' : 'needs_review';
      const band = scoreToBand(best.score);
      console.info('[cardmarket.enrichment] best-candidate-selected', {
        cardId: card.id,
        idProduct: best.candidate.idProduct,
        score: best.score,
        method: best.method,
        autoApproved: best.autoApproved,
        linkStatus: status,
        confidenceBand: band,
      });

      await registerSetMappingEvidence({
        ourSetId: card.setId,
        cardId: card.id,
        parsedSetCode: best.candidate.parsedSetCode ?? null,
        setSlug: best.candidate.setSlug ?? null,
        idExpansion: best.candidate.idExpansion ?? null,
        score: best.score,
      });

      const link = await db.cardLink.upsert({
        where: { idProduct: best.candidate.idProduct },
        create: {
          idProduct: best.candidate.idProduct,
          cardId: card.id,
          status,
          score: best.score,
          confidenceBand: band,
          matchMethod: best.method,
          provenance: 'lazy_enrichment:auto',
          reviewedAt: status === 'auto_linked' ? new Date() : null,
        },
        update: {
          cardId: card.id,
          status,
          score: best.score,
          confidenceBand: band,
          matchMethod: best.method,
          provenance: 'lazy_enrichment:auto',
          reviewedAt: status === 'auto_linked' ? new Date() : null,
        },
      });

      if (status === 'auto_linked') {
        const refreshed = await db.cardLink.findUnique({
          where: { id: link.id },
          include: {
            product: {
              include: {
                priceGuide: true,
                priceGuideSnapshots: {
                  orderBy: { snapshotDate: 'asc' },
                  take: 365,
                },
              },
            },
          },
        });
        if (refreshed) {
          console.info('[cardmarket.enrichment] matched-auto-linked', {
            cardId: card.id,
            idProduct: refreshed.idProduct,
            hasPriceGuide: Boolean(refreshed.product?.priceGuide),
            finalUrl: refreshed.product?.finalUrl ?? null,
          });
          return {
            enrichmentState: 'matched',
            mapping: {
              idProduct: refreshed.idProduct,
              status: refreshed.status,
              score: refreshed.score,
              confidenceBand: refreshed.confidenceBand,
              matchMethod: refreshed.matchMethod,
              finalUrl: refreshed.product?.finalUrl ?? null,
            },
            priceGuide: toPriceGuideDetail(refreshed.product?.priceGuide),
            priceHistory: toPriceHistoryDetail(refreshed.product?.priceGuideSnapshots ?? []),
          };
        }
      }
    }

    if (pending) {
      console.info('[cardmarket.enrichment] pending', { cardId: card.id });
      return {
        enrichmentState: 'matching',
        statusMessage: 'Matching Cardmarket pricing...',
        mapping: null,
        priceGuide: null,
        priceHistory: [],
      };
    }

    console.warn('[cardmarket.enrichment] unresolved-or-error', {
      cardId: card.id,
      hasBestCandidate: Boolean(best),
      bestScore: best?.score ?? null,
      bestProductId: best?.candidate?.idProduct ?? null,
    });
    return {
      enrichmentState: best ? 'unresolved' : 'error',
      statusMessage: best ? 'No confirmed Cardmarket match yet.' : 'Cardmarket matching failed.',
      mapping: null,
      priceGuide: null,
      priceHistory: [],
    };
  },
};
