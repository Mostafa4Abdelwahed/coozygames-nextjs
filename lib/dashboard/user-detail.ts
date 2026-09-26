import { pool } from '@/lib/db'
import {
  getMyPayments,
  getSubscriptionState,
  type PaymentRecord,
  type SubscriptionState,
} from '@/lib/billing'

/**
 * Read-only aggregation of everything tied to a single user, for the admin
 * user detail page (/dashboard/users/[id]). Lists are capped at the latest 20
 * rows, with totals returned separately.
 */

export type UserAccount = {
  id: string
  name: string | null
  email: string
  emailVerified: boolean
  image: string | null
  phoneNumber: string | null
  phoneNumberVerified: boolean | null
  role: string | null
  banned: boolean
  banReason: string | null
  banExpires: Date | null
  createdAt: Date
  updatedAt: Date
}

export type UserProvider = { providerId: string; accountId: string; createdAt: Date }

export type UserSessionRow = {
  id: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  expiresAt: Date
}

export type UserPlay = {
  id: number
  gameSlug: string
  referrer: string | null
  country: string | null
  createdAt: Date
}

export type UserAccessLink = {
  id: string
  note: string
  subscriptionDays: number
  usedAt: Date | null
  createdAt: Date
}

export type UserAuditEntry = {
  id: number
  action: string
  targetType: string | null
  targetId: string | null
  actorName: string | null
  meta: Record<string, unknown>
  createdAt: Date
}

export type UserDetail = {
  account: UserAccount
  providers: UserProvider[]
  sessions: UserSessionRow[]
  activeSessions: number
  subscription: SubscriptionState
  payments: PaymentRecord[]
  paymentsTotal: number
  plays: UserPlay[]
  playsTotal: number
  distinctGames: number
  linksUsed: UserAccessLink[]
  audit: UserAuditEntry[]
}

type LinkRow = {
  id: string
  note: string
  subscription_days: number
  used_at: Date | null
  created_at: Date
}

function mapLink(row: LinkRow): UserAccessLink {
  return {
    id: row.id,
    note: row.note,
    subscriptionDays: row.subscription_days,
    usedAt: row.used_at,
    createdAt: row.created_at,
  }
}

/** Latest 20 payments regardless of status. */
async function countUserPayments(userId: string): Promise<number> {
  const { rows } = await pool.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM payments WHERE user_id = $1`,
    [userId],
  )
  return rows[0]?.n ?? 0
}

/**
 * Runs task functions with a bounded number of concurrent connections. A cold
 * pool can open up to 10 sockets; firing every query in one Promise.all opens
 * ~10 connections at once, which a remote Postgres can reject with ETIMEDOUT.
 * Capping concurrency keeps this page working on constrained/remote databases.
 */
async function runLimited<const T extends readonly (() => Promise<unknown>)[]>(
  limit: number,
  tasks: T,
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const results = new Array(tasks.length) as unknown[]
  let cursor = 0
  async function worker() {
    while (cursor < tasks.length) {
      const index = cursor++
      results[index] = await tasks[index]()
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))
  return results as { [K in keyof T]: Awaited<ReturnType<T[K]>> }
}

export async function getUserDetail(userId: string): Promise<UserDetail | null> {
  const accountRes = await pool.query<UserAccount>(
    `SELECT id, name, email, "emailVerified", image, "phoneNumber", "phoneNumberVerified",
            role, banned, "banReason", "banExpires", "createdAt", "updatedAt"
     FROM "user"
     WHERE id = $1`,
    [userId],
  )
  const account = accountRes.rows[0]
  if (!account) return null

  const [
    providersRes,
    sessionsRes,
    activeRes,
    subscription,
    payments,
    paymentsTotal,
    playsRes,
    playsAggRes,
    linksUsedRes,
    auditRes,
  ] = await runLimited(3, [
    () =>
      pool.query<UserProvider>(
        `SELECT "providerId", "accountId", "createdAt"
         FROM account WHERE "userId" = $1 ORDER BY "createdAt" ASC`,
        [userId],
      ),
    () =>
      pool.query<UserSessionRow>(
        `SELECT id, "ipAddress", "userAgent", "createdAt", "expiresAt"
         FROM session WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 20`,
        [userId],
      ),
    () =>
      pool.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM session WHERE "userId" = $1 AND "expiresAt" > now()`,
        [userId],
      ),
    () => getSubscriptionState(userId),
    () => getMyPayments(userId),
    () => countUserPayments(userId),
    () =>
      pool.query<{ id: number; game_slug: string; referrer: string | null; country: string | null; created_at: Date }>(
        `SELECT id, game_slug, referrer, country, created_at
         FROM play_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
        [userId],
      ),
    () =>
      pool.query<{ total: number; games: number }>(
        `SELECT count(*)::int AS total, count(DISTINCT game_slug)::int AS games
         FROM play_events WHERE user_id = $1`,
        [userId],
      ),
    () =>
      pool.query<LinkRow>(
        `SELECT id, note, subscription_days, used_at, created_at
         FROM access_links WHERE used_by = $1 ORDER BY used_at DESC`,
        [userId],
      ),
    () =>
      pool.query<{
        id: number
        action: string
        target_type: string | null
        target_id: string | null
        actor_name: string | null
        meta: Record<string, unknown>
        created_at: Date
      }>(
        `SELECT a.id, a.action, a.target_type, a.target_id, a.meta, a.created_at, u.name AS actor_name
         FROM audit_log a
         LEFT JOIN "user" u ON u.id = a.actor_id
         WHERE (a.target_type = 'user' AND a.target_id = $1) OR a.actor_id = $1
         ORDER BY a.created_at DESC LIMIT 20`,
        [userId],
      ),
  ])

  return {
    account,
    providers: providersRes.rows,
    sessions: sessionsRes.rows,
    activeSessions: activeRes.rows[0]?.n ?? 0,
    subscription,
    payments,
    paymentsTotal,
    plays: playsRes.rows.map((r) => ({
      id: r.id,
      gameSlug: r.game_slug,
      referrer: r.referrer,
      country: r.country,
      createdAt: r.created_at,
    })),
    playsTotal: playsAggRes.rows[0]?.total ?? 0,
    distinctGames: playsAggRes.rows[0]?.games ?? 0,
    linksUsed: linksUsedRes.rows.map(mapLink),
    audit: auditRes.rows.map((r) => ({
      id: r.id,
      action: r.action,
      targetType: r.target_type,
      targetId: r.target_id,
      actorName: r.actor_name,
      meta: r.meta,
      createdAt: r.created_at,
    })),
  }
}
