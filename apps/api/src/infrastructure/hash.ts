import crypto from 'node:crypto';

export const createQueryHash = (parts: Record<string, string | number | undefined>): string => {
  const normalized = Object.entries(parts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v ?? ''}`)
    .join('|');

  return crypto.createHash('sha256').update(normalized).digest('hex');
};