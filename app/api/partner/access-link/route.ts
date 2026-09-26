import { NextRequest, NextResponse } from 'next/server'
import { createPartnerAccessLink } from '@/lib/access-links'
import { SUBSCRIPTION_DAYS } from '@/lib/billing'
import { logAudit } from '@/lib/dashboard/audit'
import {
  PARTNER_MAX_DAYS,
  PARTNER_VALID_DAYS_DEFAULT,
  getPartnerKey,
  partnerKeyMatches,
} from '@/lib/partner-api'

// In-memory rate limit (per process). Partner calls are server-to-server, but a
// leaked key should still not be able to hammer the endpoint.
// NOTE: This is per-process only. In multi-instance deployments (Vercel, K8s),
// rate limits are not shared across instances. For production, use Redis/Upstash.
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 120
const hits = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => t >= now - WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) return true
  recent.push(now)
  hits.set(ip, recent)
  return false
}

function publicOrigin(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  return host ? `${proto}://${host}` : request.nextUrl.origin
}

function readInt(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  return Number.isInteger(n) ? n : null
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: 'too_many_requests' }, { status: 429 })
  }

  const expected = await getPartnerKey()
  if (!expected || !partnerKeyMatches(request.headers.get('x-cg-partner-key'), expected)) {
    return NextResponse.json({ ok: false, error: 'invalid_partner_key' }, { status: 401 })
  }

  let body: { label?: unknown; valid_days?: unknown; duration_days?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const label = typeof body.label === 'string' ? body.label.trim().slice(0, 200) : ''
  const validDays = readInt(body.valid_days) ?? PARTNER_VALID_DAYS_DEFAULT
  const durationDays = readInt(body.duration_days) ?? SUBSCRIPTION_DAYS

  if (validDays < 0 || validDays > PARTNER_MAX_DAYS) {
    return NextResponse.json({ ok: false, error: 'invalid_valid_days' }, { status: 400 })
  }
  if (durationDays < 1 || durationDays > PARTNER_MAX_DAYS) {
    return NextResponse.json({ ok: false, error: 'invalid_duration_days' }, { status: 400 })
  }

  const { link, created } = await createPartnerAccessLink({
    label: label || null,
    subscriptionDays: durationDays,
    validityDays: validDays,
  })

  await logAudit(null, 'partner.access_link.create', 'access_links', link.token, {
    label: label || null,
    created,
    validDays,
    durationDays,
  })

  return NextResponse.json({
    ok: true,
    created,
    label: label || null,
    token: link.token,
    url: `${publicOrigin(request)}/complete/?token=${encodeURIComponent(link.token)}`,
    subscription_days: link.subscriptionDays,
    expires_at: link.expiresAt,
    status: link.status,
  })
}
