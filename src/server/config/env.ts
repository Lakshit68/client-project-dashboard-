import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const getCleanUrl = (url: string | undefined, fallback: string): string => {
  if (!url) return fallback;
  return url.trim().replace(/^["']|["']$/g, '');
};

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: getCleanUrl(
    process.env.DATABASE_URL,
    'postgresql://postgres:postgres@localhost:5432/agency_dashboard?schema=public'
  ),
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'fallback-access-secret-agency-2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-agency-2026',
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
