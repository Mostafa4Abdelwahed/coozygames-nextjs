import { randomBytes, timingSafeEqual } from 'node:crypto'
import { pool } from '@/lib/db'
import { getSetting } from '@/lib/dashboard/settings'

/** Server-only helpers for the reseller ("partner") access-link API. */

export const PARTNER_KEY_NAME = 'PARTNER_API_KEY'
export const PARTNER_VALID_DAYS_DEFAULT = 7
export const PARTNER_MAX_DAYS = 36500

function generatePartnerKey(): string {
  return `cgp_${randomBytes(24).toString('hex')}`
}

/** Read the partner key from app_settings, falling back to the environment. */
export async function getPartnerKey(): Promise<string | null> {
  const value = await getSetting(PARTNER_KEY_NAME)
  return value ?? null
}

/**
 * Return the partner key, minting one into app_settings on first use so the
 * dashboard always has a value to hand out. An env-provided key wins and is
 * never copied into the database.
 */
export async function getOrCreatePartnerKey(): Promise<{ key: string; generatedAt: Date | null }> {
  const existing = await pool.query<{ value: string; updated_at: Date }>(
    'SELECT value, updated_at FROM app_settings WHERE key_name = $1',
    [PARTNER_KEY_NAME],
  )
  if (existing.rows[0]?.value) {
    return { key: existing.rows[0].value, generatedAt: existing.rows[0].updated_at }
  }

  const envKey = process.env[PARTNER_KEY_NAME]
  if (envKey) return { key: envKey, generatedAt: null }

  const key = generatePartnerKey()
  const inserted = await pool.query<{ value: string; updated_at: Date }>(
    `INSERT INTO app_settings (key_name, value, is_secret)
     VALUES ($1, $2, true)
     ON CONFLICT (key_name) DO NOTHING
     RETURNING value, updated_at`,
    [PARTNER_KEY_NAME, key],
  )
  if (inserted.rows[0]) {
    return { key: inserted.rows[0].value, generatedAt: inserted.rows[0].updated_at }
  }

  // Lost a race with another process; read whatever was stored.
  const again = await pool.query<{ value: string; updated_at: Date }>(
    'SELECT value, updated_at FROM app_settings WHERE key_name = $1',
    [PARTNER_KEY_NAME],
  )
  return { key: again.rows[0]?.value ?? key, generatedAt: again.rows[0]?.updated_at ?? null }
}

/** Constant-time comparison of an incoming partner key against the expected one. */
export function partnerKeyMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
