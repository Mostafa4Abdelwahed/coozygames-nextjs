import { unstable_cache } from 'next/cache'
import { pool } from '@/lib/db'
import { ALL_GAMES } from '@/lib/games'
import { CATEGORIES } from '@/lib/categories'

export const PLAYS_TAG = 'plays'

/**
 * Read-only queries for the admin dashboard.
 * Used only by server components under app/dashboard/.
 */

export type DashboardCounts = {
  users: number
  activeSessions: number
  games: number
  categories: number
  plays24h: number
  playsTotal: number
}

/** Dashboard overview counters. */
export async function getDashboardCounts(): Promise<DashboardCounts> {
  const result = await pool.query<{
    users: number
    activeSessions: number
    plays24h: number
    playsTotal: number
  }>(`
    SELECT
      (SELECT count(*)::int FROM "user") AS users,
      (SELECT count(*)::int FROM "session" WHERE "expiresAt" > NOW()) AS active_sessions,
      (SELECT count(*)::int FROM play_events WHERE created_at > NOW() - interval '24 hours') AS plays_24h,
      (SELECT count(*)::int FROM play_events) AS plays_total
  `)

  const row = result.rows[0]
  return {
    users: row?.users ?? 0,
    activeSessions: row?.activeSessions ?? 0,
    games: ALL_GAMES.length,
    categories: CATEGORIES.length,
    plays24h: row?.plays24h ?? 0,
    playsTotal: row?.playsTotal ?? 0,
  }
}

export type UserRow = {
  id: string
  name: string | null
  email: string
  phoneNumber: string | null
  role: string | null
  banned: boolean
  createdAt: Date
}

export type UserFilters = {
  q: string
  role: '' | 'user' | 'admin'
  banned: 'all' | 'banned' | 'active'
}

export type UserPage = {
  rows: UserRow[]
  total: number
  page: number
  pages: number
}

export const USERS_PAGE_SIZE = 25

/** Escape LIKE metacharacters so user search input is matched literally. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`)
}

function buildWhere(filters: UserFilters, start: number): { sql: string; params: unknown[] } {
  const clauses: string[] = []
  const params: unknown[] = []

  if (filters.q.trim()) {
    const like = `%${escapeLike(filters.q.trim())}%`
    params.push(like)
    clauses.push(`(name ILIKE $${start + params.length - 1} ESCAPE '\\' OR email ILIKE $${start + params.length - 1} ESCAPE '\\' OR "phoneNumber" ILIKE $${start + params.length - 1} ESCAPE '\\')`)
  }

  if (filters.role) {
    params.push(filters.role)
    clauses.push(`role = $${start + params.length - 1}`)
  }

  if (filters.banned === 'banned') {
    clauses.push(`banned = TRUE`)
  } else if (filters.banned === 'active') {
    clauses.push(`banned = FALSE`)
  }

  return { sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params }
}

/** Paginated user list with optional search + role/banned filters. */
export async function listUsers(filters: UserFilters, page: number): Promise<UserPage> {
  const safePage = Math.max(1, page)
  const where = buildWhere(filters, 1)

  const count = await pool.query<{ total: number }>(
    `SELECT count(*)::int AS total FROM "user" ${where.sql}`,
    where.params,
  )
  const total = count.rows[0]?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE))
  const current = Math.min(safePage, pages)

  const offset = (current - 1) * USERS_PAGE_SIZE
  const result = await pool.query<UserRow>(
    `SELECT id, name, email, "phoneNumber", role, banned, "createdAt"
     FROM "user" ${where.sql}
     ORDER BY "createdAt" DESC
     LIMIT $${where.params.length + 1} OFFSET $${where.params.length + 2}`,
    [...where.params, USERS_PAGE_SIZE, offset],
  )

  return { rows: result.rows, total, page: current, pages }
}

export type GamesFilters = {
  q: string
  category: string
  status: '' | 'hidden' | 'featured' | 'modified'
}

export type GamesPage = {
  rows: (typeof ALL_GAMES)[number][]
  total: number
  page: number
  pages: number
}

export const GAMES_PAGE_SIZE = 25

/** Catalog grid for the dashboard: text/category/status filters, pagination. */
export function listGames(
  filters: GamesFilters,
  page: number,
  overrides: Record<string, { hidden: boolean; featured: boolean }>,
): GamesPage {
  const q = filters.q.trim().toLowerCase()
  const cat = filters.category

  const filtered = ALL_GAMES.filter((game) => {
    if (q && !game.title.toLowerCase().includes(q) && !game.slug.includes(q)) return false
    if (cat && !game.categories.some((c) => c.slug === cat)) return false
    const o = overrides[game.slug]
    if (filters.status === 'hidden' && !o?.hidden) return false
    if (filters.status === 'featured' && !o?.featured) return false
    if (filters.status === 'modified' && !o) return false
    return true
  })

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / GAMES_PAGE_SIZE))
  const current = Math.min(Math.max(1, page), pages)
  const rows = filtered.slice((current - 1) * GAMES_PAGE_SIZE, current * GAMES_PAGE_SIZE)

  return { rows, total, page: current, pages }
}

/** slug -> total real plays (cached, invalidated via PLAYS_TAG). */
async function loadPlayCounts(): Promise<Record<string, number>> {
  const result = await pool.query<{ game_slug: string; n: number }>(
    `SELECT game_slug, count(*)::int AS n FROM play_events GROUP BY game_slug`,
  )
  const map: Record<string, number> = {}
  for (const row of result.rows) map[row.game_slug] = row.n
  return map
}

export const getPlayCounts = unstable_cache(loadPlayCounts, ['play-counts'], {
  tags: [PLAYS_TAG],
  revalidate: 60,
})

export type AnalyticsOverview = {
  total: number
  last24h: number
  last7d: number
  last30d: number
}

export type TopGame = {
  slug: string
  title: string
  plays: number
}

export type TopCategory = {
  slug: string
  labelAr: string
  plays: number
}

export type DailyActive = {
  day: string
  users: number
  plays: number
}

export type HourlyPlays = {
  hour: number
  count: number
}

export type AnalyticsData = {
  overview: AnalyticsOverview
  topGames: TopGame[]
  topCategories: TopCategory[]
  dau: DailyActive[]
  hourly: HourlyPlays[]
}

/** Aggregations over play_events (cached 60s; admin-only page). */
async function loadAnalytics(): Promise<AnalyticsData> {
  const overview = await pool.query<{
    total: number
    last24h: number
    last7d: number
    last30d: number
  }>(`
    SELECT
      (SELECT count(*)::int FROM play_events) AS total,
      (SELECT count(*)::int FROM play_events WHERE created_at > NOW() - interval '24 hours') AS last24h,
      (SELECT count(*)::int FROM play_events WHERE created_at > NOW() - interval '7 days') AS last7d,
      (SELECT count(*)::int FROM play_events WHERE created_at > NOW() - interval '30 days') AS last30d
  `)

  const topGames = await pool.query<{ game_slug: string; plays: number }>(
    `SELECT game_slug, count(*)::int AS plays
     FROM play_events
     WHERE created_at > NOW() - interval '7 days'
     GROUP BY game_slug
     ORDER BY plays DESC
     LIMIT 10`,
  )

  const dau = await pool.query<{ day: string; users: number; plays: number }>(
    `SELECT date_trunc('day', created_at)::date AS day,
            count(DISTINCT user_id)::int AS users,
            count(*)::int AS plays
     FROM play_events
     WHERE created_at > NOW() - interval '14 days'
     GROUP BY day
     ORDER BY day`,
  )

  const hourly = await pool.query<{ hour: number; count: number }>(
    `SELECT EXTRACT(HOUR FROM created_at)::int AS hour, count(*)::int AS count
     FROM play_events
     WHERE created_at > NOW() - interval '7 days'
     GROUP BY hour
     ORDER BY hour`,
  )

  const bySlug = new Map(topGames.rows.map((r) => [r.game_slug, r.plays]))
  const topGamesFull = topGames.rows.map((row) => {
    const game = ALL_GAMES.find((g) => g.slug === row.game_slug)
    return { slug: row.game_slug, title: game?.title ?? row.game_slug, plays: row.plays }
  })

  const categoryCounts = new Map<string, number>()
  for (const [slug] of bySlug) {
    const game = ALL_GAMES.find((g) => g.slug === slug)
    if (!game) continue
    for (const cat of game.categories) {
      categoryCounts.set(cat.slug, (categoryCounts.get(cat.slug) ?? 0) + (bySlug.get(slug) ?? 0))
    }
  }
  const topCategories = [...categoryCounts.entries()]
    .map(([slug, plays]) => ({
      slug,
      labelAr: CATEGORIES.find((c) => c.slug === slug)?.labelAr ?? slug,
      plays,
    }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10)

  const row = overview.rows[0]
  return {
    overview: {
      total: row?.total ?? 0,
      last24h: row?.last24h ?? 0,
      last7d: row?.last7d ?? 0,
      last30d: row?.last30d ?? 0,
    },
    topGames: topGamesFull,
    topCategories,
    dau: dau.rows,
    hourly: hourly.rows,
  }
}

export const getAnalytics = unstable_cache(loadAnalytics, ['dashboard-analytics'], {
  tags: [PLAYS_TAG],
  revalidate: 60,
})