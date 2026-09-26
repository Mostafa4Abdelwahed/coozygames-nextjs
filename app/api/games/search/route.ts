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

type SearchRow = { haystack: string; result: GameSearchResult }

/**
 * Built once at module load: the catalog is immutable, so lowercasing every
 * title/label on each request is wasted work and shows up under search load.
 */
const SEARCH_ROWS: SearchRow[] = ALL_GAMES.map((game) => {
  const categoryLabel = categoryLabelAr(game.categorySlug, game.category)
  return {
    haystack: `${game.title}\n${game.category}\n${categoryLabel}`.toLowerCase(),
    result: {
      slug: game.slug,
      title: game.title,
      categorySlug: game.categorySlug,
      categoryLabel,
      plays: game.plays,
      rating: game.rating,
      thumb: game.thumb,
    },
  }
})

export function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''

  if (!q) {
    return NextResponse.json({ results: [] as GameSearchResult[] })
  }

  const needle = q.toLowerCase()
  const results: GameSearchResult[] = []

  for (const row of SEARCH_ROWS) {
    if (row.haystack.includes(needle)) {
      results.push(row.result)
      if (results.length >= RESULT_LIMIT) break
    }
  }

  return NextResponse.json(
    { results },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } },
  )
}
