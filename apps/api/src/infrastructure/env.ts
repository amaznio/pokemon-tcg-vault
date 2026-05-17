import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  POKEMON_TCG_API_KEY: z.string().default(''),
  CARD_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
  SET_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
  SEARCH_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
});

export const env = envSchema.parse(process.env);