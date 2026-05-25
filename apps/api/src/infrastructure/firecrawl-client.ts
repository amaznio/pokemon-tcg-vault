import { FirecrawlAppV1 } from '@mendable/firecrawl-js';
import { z } from 'zod';
import { env } from './env';
import { cardmarketFirecrawlExtractSchema } from '../features/cardmarket/cardmarket.schema';

const firecrawlResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

export type FirecrawlExtractResult =
  | { ok: true; data: z.infer<typeof cardmarketFirecrawlExtractSchema>; raw: unknown }
  | { ok: false; reason: 'disabled' | 'not_found' | 'blocked' | 'failed'; error: string };

const buildClient = () => new FirecrawlAppV1({ apiKey: env.FIRECRAWL_API_KEY, apiUrl: 'https://api.firecrawl.dev' });

export const extractCardmarketProductWithFirecrawl = async (
  url: string,
  timeoutMs: number,
): Promise<FirecrawlExtractResult> => {
  if (!env.FIRECRAWL_API_KEY.trim()) {
    return { ok: false, reason: 'failed', error: 'FIRECRAWL_API_KEY is missing' };
  }

  try {
    const client = buildClient();
    const response = await client.extract([url], {
      prompt:
        'Extract Pokemon Cardmarket product data from this page. Return product name, card number, rarity, printed in set, available items, from price, price trend, 30-day average price, 7-day average price, and 1-day average price. Preserve currency symbols in raw fields.',
      schema: cardmarketFirecrawlExtractSchema,
      scrapeOptions: {
        timeout: timeoutMs,
        onlyMainContent: true,
      },
    });

    const parsedResponse = firecrawlResponseSchema.safeParse(response);
    if (!parsedResponse.success) {
      return { ok: false, reason: 'failed', error: 'Unexpected Firecrawl response shape' };
    }

    const raw = parsedResponse.data.data;
    if (!raw) {
      const error = parsedResponse.data.error ?? 'No extracted JSON payload';
      const lowered = error.toLowerCase();
      if (lowered.includes('403') || lowered.includes('forbidden') || lowered.includes('blocked')) {
        return { ok: false, reason: 'blocked', error };
      }
      if (lowered.includes('404') || lowered.includes('not found')) {
        return { ok: false, reason: 'not_found', error };
      }
      return { ok: false, reason: 'failed', error };
    }

    const parsedData = cardmarketFirecrawlExtractSchema.safeParse(raw);
    if (!parsedData.success) {
      return { ok: false, reason: 'failed', error: `Schema validation failed: ${parsedData.error.message}` };
    }

    return { ok: true, data: parsedData.data, raw };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown firecrawl error';
    const lowered = message.toLowerCase();
    if (lowered.includes('403') || lowered.includes('forbidden') || lowered.includes('blocked')) {
      return { ok: false, reason: 'blocked', error: message };
    }
    if (lowered.includes('404') || lowered.includes('not found')) {
      return { ok: false, reason: 'not_found', error: message };
    }
    return { ok: false, reason: 'failed', error: message };
  }
};
