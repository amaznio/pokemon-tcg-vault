import type { Card } from '@prisma/client';

type CardSignals = {
  normalizedName: string;
  baseName: string;
  setName: string | null;
  setCode: string | null;
  collectorNumber: string | null;
};

export type ParsedCardmarketUrl = {
  finalUrl: string;
  setSlug: string | null;
  cardSlug: string | null;
  parsedSetCode: string | null;
  parsedCollectorNumber: string | null;
};

export type CardmarketMatchScore = {
  score: number;
  method: string;
  autoApproved: boolean;
  reasons: string[];
};

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const tokenize = (value: string): string[] => normalize(value).split(' ').filter(Boolean);

const stripBracketText = (value: string): string => value.replace(/\[[^\]]*\]/g, '').trim();

const toSlugName = (value: string | null): string | null => {
  if (!value) return null;
  const normalized = normalize(value).replace(/\s+/g, '-');
  return normalized || null;
};

const parseCollectorFromCardSlug = (cardSlug: string | null): { setCode: string | null; collector: string | null } => {
  if (!cardSlug) return { setCode: null, collector: null };
  const match = cardSlug.match(/-([A-Z]{2,6})(\d{1,4}[A-Z]?)$/);
  if (!match) return { setCode: null, collector: null };
  return {
    setCode: match[1] ?? null,
    collector: match[2] ?? null,
  };
};

export const parseCardmarketRedirectUrl = (url: string): ParsedCardmarketUrl => {
  try {
    const parsed = new URL(url);
    const productsSinglesIndex = parsed.pathname.indexOf('/Products/Singles/');
    if (productsSinglesIndex === -1) {
      return {
        finalUrl: url,
        setSlug: null,
        cardSlug: null,
        parsedSetCode: null,
        parsedCollectorNumber: null,
      };
    }

    const tail = parsed.pathname.slice(productsSinglesIndex + '/Products/Singles/'.length);
    const [setSlugRaw, cardSlugRaw] = tail.split('/');
    const setSlug = setSlugRaw ? decodeURIComponent(setSlugRaw) : null;
    const cardSlug = cardSlugRaw ? decodeURIComponent(cardSlugRaw) : null;
    const parsedFromCard = parseCollectorFromCardSlug(cardSlug);

    return {
      finalUrl: url,
      setSlug,
      cardSlug,
      parsedSetCode: parsedFromCard.setCode,
      parsedCollectorNumber: parsedFromCard.collector,
    };
  } catch {
    return {
      finalUrl: url,
      setSlug: null,
      cardSlug: null,
      parsedSetCode: null,
      parsedCollectorNumber: null,
    };
  }
};

export const getCardSignals = (card: Card): CardSignals => {
  const raw = (card.raw ?? {}) as Record<string, unknown>;
  const setRaw = (raw.set ?? {}) as Record<string, unknown>;
  const collectorRaw = raw.number;
  const setCodeRaw = setRaw.ptcgoCode ?? setRaw.id ?? null;
  const baseName = stripBracketText(card.name);

  return {
    normalizedName: normalize(card.name),
    baseName,
    setName: card.setName ?? null,
    setCode: typeof setCodeRaw === 'string' ? setCodeRaw.toUpperCase() : null,
    collectorNumber: typeof collectorRaw === 'string' ? collectorRaw.toUpperCase() : null,
  };
};

const nameSimilarity = (source: string, target: string): number => {
  const a = new Set(tokenize(source));
  const b = new Set(tokenize(target));
  if (!a.size || !b.size) return 0;
  const common = [...a].filter((token) => b.has(token)).length;
  return common / Math.max(a.size, b.size);
};

export const scoreCardmarketCandidate = (
  card: Card,
  product: {
    name: string;
    setSlug: string | null;
    parsedSetCode: string | null;
    parsedCollectorNumber: string | null;
  },
): CardmarketMatchScore => {
  const signals = getCardSignals(card);
  const reasons: string[] = [];
  let score = 0;

  const setCodeMatch = Boolean(
    signals.setCode && product.parsedSetCode && signals.setCode.toUpperCase() === product.parsedSetCode.toUpperCase(),
  );
  if (setCodeMatch) {
    score += 0.45;
    reasons.push('set_code');
  }

  const setSlugMatch = Boolean(
    signals.setName && product.setSlug && toSlugName(signals.setName) === toSlugName(product.setSlug),
  );
  if (setSlugMatch) {
    score += 0.35;
    reasons.push('set_slug');
  }

  const collectorMatch = Boolean(
    signals.collectorNumber &&
      product.parsedCollectorNumber &&
      signals.collectorNumber.replace(/^0+/, '') === product.parsedCollectorNumber.toUpperCase().replace(/^0+/, ''),
  );
  if (collectorMatch) {
    score += 0.45;
    reasons.push('collector_number');
  }

  const baseName = stripBracketText(product.name);
  const similarity = nameSimilarity(signals.baseName, baseName);
  if (similarity > 0) {
    score += Math.min(0.25, similarity * 0.25);
    reasons.push('name_similarity');
  }

  const hasStrongSignal = setCodeMatch || setSlugMatch;
  const autoApproved = hasStrongSignal && collectorMatch && similarity >= 0.4;

  return {
    score: Math.max(0, Math.min(1, score)),
    method: reasons.join('+') || 'no_match',
    autoApproved,
    reasons,
  };
};
