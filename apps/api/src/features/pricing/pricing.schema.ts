import { z } from 'zod';

export const firecrawlPriceExtractSchema = z.object({
  productName: z.string().optional().nullable(),
  cardNumber: z.string().optional().nullable(),
  rarity: z.string().optional().nullable(),
  printedInSet: z.string().optional().nullable(),
  availableItems: z.union([z.string(), z.number()]).optional().nullable(),
  fromPrice: z.union([z.string(), z.number()]).optional().nullable(),
  priceTrend: z.union([z.string(), z.number()]).optional().nullable(),
  avgSellPrice30d: z.union([z.string(), z.number()]).optional().nullable(),
  avgPrice7d: z.union([z.string(), z.number()]).optional().nullable(),
  avgPrice1d: z.union([z.string(), z.number()]).optional().nullable(),
  pricingUrl: z.string().optional().nullable(),
});

export type FirecrawlPriceExtract = z.infer<typeof firecrawlPriceExtractSchema>;
