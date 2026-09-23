import { pool } from '@/lib/db'
import { ALL_GAMES } from '@/lib/games'
import { CATEGORIES } from '@/lib/categories'

/**
 * Read-only queries for the admin dashboard.
 * Used only by server components under app/dashboard/.
 */

export type DashboardCounts = {
  users: number
  activeSessions: number
  games: number
  categories: number
}

/** Dashboard overview counters (Phase 1: no play_events yet). */
export async function getDashboardCounts(): Promise<DashboardCounts> {
  const result = await pool.query<{
    users: number
    activeSessions: number
  }>(`
    SELECT
      (SELECT count(*)::int FROM "user") AS users,
      (SELECT count(*)::int FROM "session" WHERE "expiresAt" > NOW()) AS active_sessions
  `)

  return {
    users: result.rows[0]?.users ?? 0,
    activeSessions: result.rows[0]?.activeSessions ?? 0,
    games: ALL_GAMES.length,
    categories: CATEGORIES.length,
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
}

export type GamesPage = {
  rows: (typeof ALL_GAMES)[number][]
  total: number
  page: number
  pages: number
}

export const GAMES_PAGE_SIZE = 25

/** Catalog grid for the dashboard: text + category filters, pagination. */
export function listGames(filters: GamesFilters, page: number): GamesPage {
  const q = filters.q.trim().toLowerCase()
  const cat = filters.category

  const filtered = ALL_GAMES.filter((game) => {
    if (q && !game.title.toLowerCase().includes(q) && !game.slug.includes(q)) return false
    if (cat && !game.categories.some((c) => c.slug === cat)) return false
    return true
  })

  const total = filtered.length
  const pages = Math.max(1, Math.ceil(total / GAMES_PAGE_SIZE))
  const current = Math.min(Math.max(1, page), pages)
  const rows = filtered.slice((current - 1) * GAMES_PAGE_SIZE, current * GAMES_PAGE_SIZE)

  return { rows, total, page: current, pages }
}