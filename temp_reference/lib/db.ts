import { Pool } from "pg";

// Pool único compartilhado (Neon Postgres). Reutilizado entre requisições
// em desenvolvimento para evitar esgotar as conexões com hot-reload.
const globalForDb = globalThis as unknown as { pool?: Pool };

export const pool =
  globalForDb.pool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export async function query<T = unknown>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await pool.query(text, params as never[]);
  return result.rows as T[];
}
