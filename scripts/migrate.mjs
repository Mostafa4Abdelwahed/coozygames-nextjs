// Minimal SQL migration runner.
// Applies `db/migrations/*.sql` files in order and tracks them in `_migrations`.
// Each file runs inside its own transaction.
//
// Usage: DATABASE_URL=... npm run migrate

import { Client } from 'pg'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const migrationsDir = join(repoRoot, 'db', 'migrations')

// Minimal .env loader (Next loads these automatically; standalone scripts don't).
for (const file of ['.env.local', '.env']) {
  const path = join(repoRoot, file)
  if (!existsSync(path)) continue
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m || m[1] in process.env) continue
    let value = m[2]
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[m[1]] = value
  }
}

if (!process.env.DATABASE_URL) {
  console.error('[migrate] DATABASE_URL is not set')
  process.exit(1)
}

const client = new Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

try {
  await client.query(`CREATE TABLE IF NOT EXISTS _migrations (
    name       text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`)

  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()
  const { rows } = await client.query('SELECT name FROM _migrations')
  const applied = new Set(rows.map((r) => r.name))

  let ran = 0
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`[migrate] skip   ${file}`)
      continue
    }

    const sql = readFileSync(join(migrationsDir, file), 'utf8')
    console.log(`[migrate] apply  ${file}`)
    await client.query('BEGIN')
    try {
      await client.query(sql)
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file])
      await client.query('COMMIT')
      ran++
    } catch (err) {
      await client.query('ROLLBACK')
      throw new Error(`migration "${file}" failed: ${err.message}`)
    }
  }

  console.log(`[migrate] done: ${ran} applied, ${files.length - ran} already applied`)
} finally {
  await client.end()
}