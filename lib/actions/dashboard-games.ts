'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { pool } from '@/lib/db'
import { getGameBySlug, type Game } from '@/lib/games'
import { logAudit } from '@/lib/dashboard/audit'
import { requireAdmin } from '@/lib/dashboard/admin'
import { OVERRIDES_TAG } from '@/lib/dashboard/overrides'

export type OverrideState = { done: boolean; error?: string }

const MAX_TITLE_AR = 120
const MAX_THUMB = 500
const MAX_WEIGHT = 100_000
const THUMB_PREFIX = '/image/'

function revalidateAfterOverride(game: Game): void {
  revalidateTag(OVERRIDES_TAG, 'max')
  revalidatePath('/', 'page')
  revalidatePath('/games', 'page')
  revalidatePath(`/game/${game.slug}`, 'page')
  for (const cat of game.categories) {
    revalidatePath(`/game-category/${cat.slug}`, 'page')
  }
}

export async function upsertGameOverride(_state: OverrideState, formData: FormData): Promise<OverrideState> {
  const actor = await requireAdmin()
  const slug = String(formData.get('slug') ?? '')
  const game = getGameBySlug(slug)
  if (!game) return { done: true, error: 'gameNotFound' }

  const rawTitle = String(formData.get('titleAr') ?? '').trim()
  const titleAr = rawTitle ? rawTitle.slice(0, MAX_TITLE_AR) : null
  const rawThumb = String(formData.get('thumb') ?? '').trim()
  const thumb = rawThumb ? rawThumb.slice(0, MAX_THUMB) : null
  if (thumb && !thumb.startsWith(THUMB_PREFIX)) {
    return { done: true, error: 'thumbInvalidPrefix' }
  }

  let sortWeight = 0
  {
    const parsed = Number(formData.get('sortWeight') ?? '0')
    if (!Number.isFinite(parsed)) return { done: true, error: 'weightInvalid' }
    sortWeight = Math.max(-MAX_WEIGHT, Math.min(MAX_WEIGHT, Math.round(parsed)))
  }

  const hidden = formData.get('hidden') === 'on'
  const featured = formData.get('featured') === 'on'

  await pool.query(
    `INSERT INTO game_overrides (slug, hidden, featured, sort_weight, title_ar, thumb, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (slug) DO UPDATE SET
       hidden = $2, featured = $3, sort_weight = $4, title_ar = $5, thumb = $6,
       updated_by = $7, updated_at = NOW()`,
    [slug, hidden, featured, sortWeight, titleAr, thumb, actor.id],
  )

  await logAudit(actor.id, 'game.override.upsert', 'game', slug, {
    hidden,
    featured,
    sortWeight,
    titleAr,
    thumb,
  })
  revalidateAfterOverride(game)
  return { done: true }
}

export async function clearGameOverride(_state: OverrideState, formData: FormData): Promise<OverrideState> {
  const actor = await requireAdmin()
  const slug = String(formData.get('slug') ?? '')
  const game = getGameBySlug(slug)
  if (!game) return { done: true, error: 'gameNotFound' }

  await pool.query('DELETE FROM game_overrides WHERE slug = $1', [slug])
  await logAudit(actor.id, 'game.override.clear', 'game', slug, {})
  revalidateAfterOverride(game)
  return { done: true }
}