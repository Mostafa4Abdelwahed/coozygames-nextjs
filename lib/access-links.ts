import { randomBytes } from 'node:crypto'
import { pool } from '@/lib/db'

/** Server-only helpers for one-time access links (/complete/?token=...). */

export type AccessLinkStatus = 'active' | 'used' | 'expired'

export type AccessLink = {
  id: string
  token: string
  note: string
  subscriptionDays: number
  expiresAt: Date | null
  createdAt: Date
  createdByName: string | null
  usedByUserId: string | null
  usedByName: string | null
  usedByEmail: string | null
  usedAt: Date | null
  status: AccessLinkStatus
}

export type AccessLinkStats = {
  active: number
  used: number
  expired: number
}

type AccessLinkRow = {
  id: string
  token: string
  note: string
  subscription_days: number
  expires_at: Date | null
  created_at: Date
  created_name: string | null
  used_by: string | null
  used_name: string | null
  used_email: string | null
  used_at: Date | null
  status: AccessLinkStatus
}

const LINK_COLUMNS = `
  l.id, l.token, l.note, l.subscription_days, l.expires_at, l.created_at,
  l.used_by, l.used_at,
  c.name AS created_name,
  u.name AS used_name, u.email AS used_email,
  CASE
    WHEN l.used_at IS NOT NULL THEN 'used'
    WHEN l.expires_at IS NOT NULL AND l.expires_at < now() THEN 'expired'
    ELSE 'active'
  END AS status`

function mapLinkRow(row: AccessLinkRow): AccessLink {
  return {
    id: row.id,
    token: row.token,
    note: row.note,
    subscriptionDays: row.subscription_days,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    createdByName: row.created_name,
    usedByUserId: row.used_by,
    usedByName: row.used_name,
    usedByEmail: row.used_email,
    usedAt: row.used_at,
    status: row.status,
  }
}

/** 256-bit URL-safe token (43 chars, same shape as the /complete/?token=… links). */
export function generateAccessToken(): string {
  return randomBytes(32).toString('base64url')
}

export async function createAccessLink(input: {
  token: string
  note: string
  subscriptionDays: number
  validityDays: number
  createdBy: string
}): Promise<void> {
  await pool.query(
    `INSERT INTO access_links (token, note, subscription_days, expires_at, created_by)
     VALUES ($1, $2, $3,
             CASE WHEN $4 > 0 THEN now() + $4 * interval '1 day' ELSE NULL END,
             $5)`,
    [input.token, input.note, input.subscriptionDays, input.validityDays, input.createdBy],
  )
}

/** Resolve a raw token. Returns null when it does not exist. */
export async function resolveAccessLink(token: string): Promise<AccessLink | null> {
  const { rows } = await pool.query<AccessLinkRow>(
    `SELECT ${LINK_COLUMNS}
     FROM access_links l
     LEFT JOIN "user" u ON u.id = l.used_by
     LEFT JOIN "user" c ON c.id = l.created_by
     WHERE l.token = $1`,
    [token],
  )
  return rows[0] ? mapLinkRow(rows[0]) : null
}

export async function listAccessLinks(
  page: number,
  pageSize = 20,
): Promise<{ rows: AccessLink[]; total: number; pages: number }> {
  const parsed = page > 0 ? page : 1
  const offset = (parsed - 1) * pageSize

  const [list, count] = await Promise.all([
    pool.query<AccessLinkRow>(
      `SELECT ${LINK_COLUMNS}
       FROM access_links l
       LEFT JOIN "user" u ON u.id = l.used_by
       LEFT JOIN "user" c ON c.id = l.created_by
       ORDER BY l.created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset],
    ),
    pool.query<{ n: number }>('SELECT count(*)::int AS n FROM access_links'),
  ])

  const total = count.rows[0]?.n ?? 0
  return { rows: list.rows.map(mapLinkRow), total, pages: Math.max(1, Math.ceil(total / pageSize)) }
}

export async function accessLinkStats(): Promise<AccessLinkStats> {
  const { rows } = await pool.query<{
    active: number
    used: number
    expired: number
  }>(`
    SELECT
      count(*) FILTER (WHERE used_at IS NULL AND (expires_at IS NULL OR expires_at > now()))::int AS active,
      count(*) FILTER (WHERE used_at IS NOT NULL)::int AS used,
      count(*) FILTER (WHERE used_at IS NULL AND expires_at IS NOT NULL AND expires_at < now())::int AS expired
    FROM access_links`)

  const row = rows[0] ?? { active: 0, used: 0, expired: 0 }
  return { active: row.active, used: row.used, expired: row.expired }
}

/**
 * Redeem a link atomically: burns it (used_by/used_at) and grants/extends the
 * subscription. Fails with a reason when the link is missing, already used or
 * expired. There is no cron: expiry is decided at lookup time.
 */
export async function redeemAccessLink(
  token: string,
  userId: string,
): Promise<
  { ok: true; expiresAt: Date; subscriptionDays: number } | { ok: false; reason: 'invalid' | 'used' | 'expired' }
> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const locked = await client.query<{ id: string; subscription_days: number; used_at: Date | null; expires_at: Date | null }>(
      `SELECT id, subscription_days, used_at, expires_at
       FROM access_links
       WHERE token = $1
       FOR UPDATE`,
      [token],
    )
    const row = locked.rows[0]
    if (!row) {
      await client.query('ROLLBACK')
      return { ok: false, reason: 'invalid' }
    }
    if (row.used_at) {
      await client.query('ROLLBACK')
      return { ok: false, reason: 'used' }
    }
    if (row.expires_at && row.expires_at.getTime() < Date.now()) {
      await client.query('ROLLBACK')
      return { ok: false, reason: 'expired' }
    }

    await client.query('UPDATE access_links SET used_by = $2, used_at = now() WHERE id = $1', [row.id, userId])

    const sub = await client.query<{ expires_at: Date }>(
      `INSERT INTO subscriptions (user_id, plan, started_at, expires_at)
       VALUES (
         $1, 'gift',
         least(now(), COALESCE((SELECT expires_at FROM subscriptions WHERE user_id = $1), now())),
         COALESCE(
           (SELECT expires_at FROM subscriptions WHERE user_id = $1 AND expires_at > now()),
           now()
         ) + $2 * interval '1 day'
       )
       ON CONFLICT (user_id) DO UPDATE SET
         started_at = EXCLUDED.started_at,
         expires_at = EXCLUDED.expires_at,
         updated_at = now()
       RETURNING expires_at`,
      [userId, row.subscription_days],
    )

    await client.query('COMMIT')
    return { ok: true, expiresAt: sub.rows[0].expires_at, subscriptionDays: row.subscription_days }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/** Delete an unused link (revoke). Returns false when it was already gone. */
export async function deleteAccessLink(token: string): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM access_links WHERE token = $1 AND used_at IS NULL', [token])
  return (rowCount ?? 0) > 0
}