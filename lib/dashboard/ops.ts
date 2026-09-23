import { join, relative as relativePath } from 'node:path'
import { readdir, stat, unlink } from 'node:fs/promises'
import { pool } from '@/lib/db'
import { getSetting } from '@/lib/dashboard/settings'
import { formatBytes } from '@/lib/dashboard/bytes'

/**
 * Server-only helpers for /dashboard/ops.
 * fs is safe here: these pages are admin-only and server-rendered on demand.
 */

export const IMAGE_CACHE_DIR = join(process.cwd(), 'image-cache')

/** Variants (derivable files) end with .w<width>.q<quality>.<format>. */
const VARIANT_RE = /\.w\d+\.q\d+\.(?:webp|avif|jpeg|png)$/i

export type CacheFileInfo = { path: string; sizeBytes: number; mtimeMs: number; isVariant: boolean }

export type ImageCacheStats = {
  files: number
  originals: number
  variants: number
  sizeBytes: number
  sizePretty: string
  largeFiles: number
  largest: { name: string; sizeBytes: number; sizePretty: string }[]
}

/** Recursively list every cached file with size and mtime. */
async function listCacheFiles(dir = IMAGE_CACHE_DIR, acc: CacheFileInfo[] = []): Promise<CacheFileInfo[]> {
  let entries
  try {
    entries = await readdir(/* turbopackIgnore: true */ dir, { withFileTypes: true })
  } catch {
    return acc
  }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await listCacheFiles(full, acc)
      continue
    }
    if (!entry.isFile()) continue
    try {
      const s = await stat(/* turbopackIgnore: true */ full)
      if (!s.isFile()) continue
      acc.push({ path: full, sizeBytes: s.size, mtimeMs: s.mtimeMs, isVariant: VARIANT_RE.test(entry.name) })
    } catch {
      // file vanished between readdir and stat — ignore
    }
  }
  return acc
}

export async function getImageCacheStats(): Promise<ImageCacheStats> {
  const files = await listCacheFiles()
  const counts = { originals: 0, variants: 0, largeFiles: 0 }
  let sizeBytes = 0
  for (const f of files) {
    if (f.isVariant) counts.variants += 1
    else counts.originals += 1
    if (f.sizeBytes > 1024 * 1024) counts.largeFiles += 1
    sizeBytes += f.sizeBytes
  }
  const largest = files
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, 10)
    .map((f) => ({ name: relativePath(IMAGE_CACHE_DIR, f.path), sizeBytes: f.sizeBytes, sizePretty: formatBytes(f.sizeBytes) }))

  return {
    files: files.length,
    originals: counts.originals,
    variants: counts.variants,
    sizeBytes,
    sizePretty: formatBytes(sizeBytes),
    largeFiles: counts.largeFiles,
    largest,
  }
}

export type PurgeResult = {
  deleted: number
  freedBytes: number
  errors: string[]
}

/**
 * Safe purge: only removable files are variants (regenerated on demand), and
 * only those not written within `minAgeMs` (avoids racing in-flight writes).
 * Originals are never deleted.
 */
export async function purgeImageCache(minAgeMs = 60 * 60 * 1000): Promise<PurgeResult> {
  const files = await listCacheFiles()
  const now = Date.now()
  const result: PurgeResult = { deleted: 0, freedBytes: 0, errors: [] }

  for (const f of files) {
    if (!f.isVariant) continue
    if (now - f.mtimeMs < minAgeMs) continue
    try {
      await unlink(/* turbopackIgnore: true */ f.path)
      result.deleted += 1
      result.freedBytes += f.sizeBytes
    } catch (err) {
      result.errors.push((err as Error).message)
    }
  }
  return result
}

export type WispState = { ok: boolean; ms: number; detail?: string }

export const WISP_HEALTH_DEFAULT = 'http://wisp:8081/health'

export async function getWispHealthUrl(): Promise<string> {
  return (await getSetting('WISP_HEALTH_URL')) || WISP_HEALTH_DEFAULT
}

export async function checkWispHealth(timeoutMs = 2500): Promise<WispState> {
  const url = await getWispHealthUrl()
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(timer)
    const body = (await res.json().catch(() => null)) as { ok?: boolean } | null
    const ok = res.ok && body?.ok !== false
    return { ok, ms: Date.now() - start, detail: ok ? 'متصل' : `HTTP ${res.status}` }
  } catch {
    return { ok: false, ms: Date.now() - start, detail: 'غير متصل' }
  }
}

export type DbStatRow = { name: string; sizeBytes: number; sizePretty: string }

export type DbStats = {
  playEvents: number
  auditLogs: number
  overrides: number
  tables: DbStatRow[]
}

const DB_TABLES = ['"user"', 'session', 'account', 'verification', 'play_events', 'game_overrides', 'audit_log']

export async function getDbStats(): Promise<DbStats> {
  const counts = await pool.query<{ play_events: number; audit_log: number; game_overrides: number }>(
    `SELECT
       (SELECT count(*)::int FROM play_events) AS play_events,
       (SELECT count(*)::int FROM audit_log) AS audit_log,
       (SELECT count(*)::int FROM game_overrides) AS game_overrides`,
  )
  const tables = await pool.query<{ name: string; sizeBytes: number; sizePretty: string }>(
    `SELECT c.relname AS name,
            pg_total_relation_size(c.oid)::bigint AS "sizeBytes",
            pg_size_pretty(pg_total_relation_size(c.oid)) AS "sizePretty"
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind = 'r'
       AND c.relname IN ($1, $2, $3, $4, $5, $6, $7)
     ORDER BY pg_total_relation_size(c.oid) DESC`,
    DB_TABLES.map((t) => t.replace(/"/g, '')),
  )
  const row = counts.rows[0]
  return {
    playEvents: row?.play_events ?? 0,
    auditLogs: row?.audit_log ?? 0,
    overrides: row?.game_overrides ?? 0,
    tables: tables.rows,
  }
}