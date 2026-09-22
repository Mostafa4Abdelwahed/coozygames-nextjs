import { ALL_GAMES, resolveCategorySlug } from './games'
import { categoryLabelAr } from './category-meta'

/**
 * Server-only: derives navigation categories from the full catalog.
 * Must never be imported by a client component — see `lib/category-meta.ts`
 * for the client-safe subset.
 */

export type Category = {
  slug: string
  label: string
  /** Arabic display label */
  labelAr: string
  /** Number of games in this category */
  count: number
}

/** Categories with fewer games than this are hidden from navigation. */
const MIN_CATEGORY_COUNT = 3

function buildCategories(): Category[] {
  const map = new Map<string, { label: string; count: number }>()
  for (const game of ALL_GAMES) {
    for (const cat of game.categories) {
      const entry = map.get(cat.slug) ?? { label: cat.label, count: 0 }
      entry.count += 1
      map.set(cat.slug, entry)
    }
  }
  return [...map.entries()]
    .map(([slug, { label, count }]) => ({
      slug,
      label,
      labelAr: categoryLabelAr(slug, label),
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

const ALL_CATEGORIES: Category[] = buildCategories()

/** Categories shown in navigation (hidden when too few games). */
export const CATEGORIES: Category[] = ALL_CATEGORIES.filter((c) => c.count >= MIN_CATEGORY_COUNT)

/** Every slug present in the data (for static paths, including tiny ones). */
export function allCategorySlugs(): string[] {
  return ALL_CATEGORIES.map((c) => c.slug)
}

export function getCategory(slug: string): Category | undefined {
  const resolved = resolveCategorySlug(slug)
  return ALL_CATEGORIES.find((c) => c.slug === resolved)
}

/** Serializable subset handed to the client shell/sidebar. */
export function navCategories(): { slug: string; labelAr: string; count: number }[] {
  return CATEGORIES.map((c) => ({ slug: c.slug, labelAr: c.labelAr, count: c.count }))
}
