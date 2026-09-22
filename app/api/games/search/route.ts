import { NextResponse } from 'next/server'
import { ALL_GAMES } from '@/lib/games'
import { categoryLabelAr } from '@/lib/category-meta'

/** Kept in sync with the client overlay's historical result limit. */
const RESULT_LIMIT = 7

/**
 * Slim search rows only — never expose the full catalog (playUrl etc.) to clients.
 */
export type GameSearchResult = {
  slug: string
  title: string
  categorySlug: string
  categoryLabel: string
  plays: string
  rating: number
  thumb?: string
}

export function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''

  if (!q) {
    return NextResponse.json({ results: [] as GameSearchResult[] })
  }

  const lower = q.toLowerCase()
  const results: GameSearchResult[] = []

  for (const game of ALL_GAMES) {
    const matches =
      game.title.toLowerCase().includes(lower) ||
      game.category.toLowerCase().includes(lower) ||
      categoryLabelAr(game.categorySlug, game.category).includes(q)

    if (matches) {
      results.push({
        slug: game.slug,
        title: game.title,
        categorySlug: game.categorySlug,
        categoryLabel: categoryLabelAr(game.categorySlug, game.category),
        plays: game.plays,
        rating: game.rating,
        thumb: game.thumb,
      })
      if (results.length >= RESULT_LIMIT) break
    }
  }

  return NextResponse.json({ results })
}
