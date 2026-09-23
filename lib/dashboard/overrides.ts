import { unstable_cache } from 'next/cache'
import { pool } from '@/lib/db'
import type { Game } from '@/lib/games'

/**
 * Overlay layer over the static catalog (data/games.json).
 * Public pages read here instead of the raw catalog so admin edits surface.
 */

export const OVERRIDES_TAG = 'overrides'

export type GameOverride = {
  slug: string
  hidden: boolean
  featured: boolean
  sortWeight: number
  titleAr: string | null
  thumb: string | null
}

type OverrideRow = {
  slug: string
  hidden: boolean
  featured: boolean
  sort_weight: number
  title_ar: string | null
  thumb: string | null
}

async function loadOverrides(): Promise<Record<string, GameOverride>> {
  const result = await pool.query<OverrideRow>(
    'SELECT slug, hidden, featured, sort_weight, title_ar, thumb FROM game_overrides',
  )
  const map: Record<string, GameOverride> = {}
  for (const row of result.rows) {
    map[row.slug] = {
      slug: row.slug,
      hidden: row.hidden,
      featured: row.featured,
      sortWeight: row.sort_weight,
      titleAr: row.title_ar,
      thumb: row.thumb,
    }
  }
  return map
}

/** Cached overrides map shared across public + dashboard server components. */
export const getOverrides = unstable_cache(loadOverrides, ['game-overrides'], {
  tags: [OVERRIDES_TAG],
  revalidate: 60,
})

export async function getPublicOverrides(): Promise<Record<string, GameOverride>> {
  return getOverrides()
}

/** Apply title_ar / thumb overrides to a single game (titles keep the override). */
export function applyGameOverride(game: Game, overrides: Record<string, GameOverride>): Game {
  const o = overrides[game.slug]
  if (!o) return game
  return {
    ...game,
    title: o.titleAr || game.title,
    thumb: o.thumb || game.thumb,
  }
}

/**
 * Merge overrides into a games list:
 * - hidden games are dropped from public listings
 * - featured games come first, ordered by sort_weight (desc), stable otherwise
 */
export function applyOverrides(games: Game[], overrides: Record<string, GameOverride>): Game[] {
  const merged: { game: Game; override?: GameOverride }[] = []
  for (const game of games) {
    const o = overrides[game.slug]
    if (o?.hidden) continue
    merged.push({ game: o ? applyGameOverride(game, overrides) : game, override: o })
  }
  return merged
    .slice()
    .sort((a, b) => {
      const fa = a.override?.featured ? 1 : 0
      const fb = b.override?.featured ? 1 : 0
      if (fa !== fb) return fb - fa
      if (fa === 1) return (b.override?.sortWeight ?? 0) - (a.override?.sortWeight ?? 0)
      return 0
    })
    .map((x) => x.game)
}