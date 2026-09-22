import { Pool } from 'pg'

const globalForPg = globalThis as unknown as { __coozyPgPool?: Pool }

export const pool =
  globalForPg.__coozyPgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })

if (!globalForPg.__coozyPgPool) {
  globalForPg.__coozyPgPool = pool
}
