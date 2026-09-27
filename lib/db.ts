import { Pool } from 'pg';

const globalForDb = globalThis as unknown as { nexaPool?: Pool };

export const db = globalForDb.nexaPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

if (process.env.NODE_ENV !== 'production') globalForDb.nexaPool = db;

export async function checkDatabase() {
  const result = await db.query<{ ok: number }>('SELECT 1 AS ok');
  return result.rows[0]?.ok === 1;
}
