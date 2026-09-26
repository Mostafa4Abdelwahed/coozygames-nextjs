import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/dashboard/admin'
import { purgeImageCache, IMAGE_CACHE_DIR } from '@/lib/dashboard/ops'
import { logAudit } from '@/lib/dashboard/audit'

// In-memory rate limit (per process): a purge is a rare, expensive op.
// NOTE: This is per-process only. In multi-instance deployments (Vercel, K8s),
// rate limits are not shared across instances. For production, use Redis/Upstash.
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 10
const hits = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => t >= now - WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) return true
  recent.push(now)
  hits.set(ip, recent)
  return false
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: 'طلبات كثيرة — حاول لاحقًا' }, { status: 429 })
  }

  let actor
  try {
    actor = await requireAdmin()
  } catch {
    return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 403 })
  }

  let confirm = false
  try {
    const body = (await request.json()) as { confirm?: unknown }
    confirm = body?.confirm === true
  } catch {
    confirm = false
  }
  if (!confirm) {
    return NextResponse.json({ ok: false, error: 'التأكيد مطلوب' }, { status: 400 })
  }

  const result = await purgeImageCache(60 * 60 * 1000)
  await logAudit(actor.id, 'ops.purge_cache', 'ops', 'image-cache', {
    dir: IMAGE_CACHE_DIR,
    deleted: result.deleted,
    freedBytes: result.freedBytes,
    errors: result.errors.length,
  })

  revalidatePath('/dashboard/ops', 'page')
  return NextResponse.json({
    ok: true,
    deleted: result.deleted,
    freedBytes: result.freedBytes,
    errors: result.errors,
  })
}