import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });

const envBoolean = (defaultValue: boolean) =>
  z.preprocess((value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) return true;
      if (['false', '0', 'no', 'n', 'off', ''].includes(normalized)) return false;
    }
    return value;
  }, z.boolean().default(defaultValue));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  POKEMON_TCG_API_KEY: z.string().default(''),
  CARD_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
  SET_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
  SEARCH_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  CARDMARKET_PRODUCTS_URL: z.string().url().optional(),
  CARDMARKET_PRICE_GUIDE_URL: z.string().url().optional(),
  CARDMARKET_PRODUCTS_PATH: z.string().min(1).optional(),
  CARDMARKET_PRICE_GUIDE_PATH: z.string().min(1).optional(),
  CARDMARKET_IMPORT_MATCH_LINKS: envBoolean(false),
  CARDMARKET_LAZY_ENRICHMENT_ENABLED: envBoolean(false),
  CARDMARKET_ENRICHMENT_MAX_CANDIDATES: z.coerce.number().int().positive().default(10),
  CARDMARKET_ENRICHMENT_TIME_BUDGET_MS: z.coerce.number().int().positive().default(1200),
  CARDMARKET_ENRICHMENT_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(1800),
  CARDMARKET_ENRICHMENT_REDIRECT_LIMIT: z.coerce.number().int().positive().default(5),
  CARDMARKET_ENRICHMENT_COOLDOWN_MINUTES: z.coerce.number().int().positive().default(30),
  CARDMARKET_ENRICHMENT_ENABLED: envBoolean(false),
  FIRECRAWL_API_KEY: z.string().default(''),
  CARDMARKET_ENRICHMENT_TTL_HOURS: z.coerce.number().int().positive().default(168),
  CARDMARKET_ENRICHMENT_FAILURE_COOLDOWN_HOURS: z.coerce.number().int().positive().default(24),
  CARDMARKET_ENRICHMENT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
});

export const env = envSchema.parse(process.env);
