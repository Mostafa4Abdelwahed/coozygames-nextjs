import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { auth } from '@/lib/auth'
import { getGameBySlug } from '@/lib/games'

// In-memory rate limit (per process): N plays per IP per window. The event is
// fire-and-forget so over-limit requests are silently dropped.
const RATE_WINDOW_MS = 5 * 60_000
const RATE_LIMIT = 30
const hits = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const windowStart = now - RATE_WINDOW_MS
  const recent = (hits.get(ip) ?? []).filter((t) => t >= windowStart)
  if (recent.length >= RATE_LIMIT) return true
  recent.push(now)
  hits.set(ip, recent)
  return false
}

export async function POST(request: NextRequest) {
  let slug: string | undefined
  try {
    const body = (await request.json()) as { slug?: unknown }
    if (typeof body.slug === 'string') slug = body.slug
  } catch {
    slug = undefined
  }

  if (!slug || !getGameBySlug(slug)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (isRateLimited(request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown')) {
    return NextResponse.json({ ok: true })
  }

  let userId: string | null = null
  let sessionId: string | null = null
  try {
    const session = await auth.api.getSession({ headers: request.headers })
    userId = session?.user.id ?? null
    sessionId = session?.session.id ?? null
  } catch {
    // Tracking must never block playback — leave user fields null.
  }

  const country =
    request.headers.get('cf-ipcountry') ?? request.headers.get('x-country') ?? null

  await pool
    .query(
      `INSERT INTO play_events (game_slug, user_id, session_id, referrer, country)
       VALUES ($1, $2, $3, $4, $5)`,
      [slug, userId, sessionId, request.headers.get('referer'), country],
    )
    .catch(() => null)

  return NextResponse.json({ ok: true })
}