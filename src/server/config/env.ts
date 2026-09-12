import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const cleanString = (val: string | undefined): string => {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
};

const defaultDbUrl = 'postgresql://postgres:Lucky%4085022678@db.ouryveraxibpdwefnian.supabase.co:6543/postgres?sslmode=require';

let dbUrl = cleanString(process.env.DATABASE_URL);
if (!dbUrl || (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://'))) {
  console.log('⚠️ DATABASE_URL missing or invalid format. Using production Supabase fallback URL.');
  dbUrl = defaultDbUrl;
}

// Override process.env.DATABASE_URL for Prisma Client runtime
process.env.DATABASE_URL = dbUrl;

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: dbUrl,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'fallback-access-secret-agency-2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-agency-2026',
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};
