import type { IconType } from 'react-icons'
import { MdGroup, MdHistory, MdHome, MdNewReleases, MdUpdate, MdWhatshot } from 'react-icons/md'
import { ALL_GAMES, categoryStyle, resolveCategorySlug } from './games'

export type Category = {
  slug: string
  label: string
  icon: IconType
  /** Number of games in this category */
  count: number
}

export const SIDEBAR_TOP: { label: string; href: string; icon: IconType; disabled?: boolean }[] = [
  { label: 'الرئيسية', href: '/', icon: MdHome },
  { label: 'لُعبت مؤخرًا', href: '', icon: MdHistory, disabled: true },
  { label: 'جديد', href: '/games/?sort=new', icon: MdNewReleases },
  { label: 'ألعاب رائجة', href: '/games/?sort=hot', icon: MdWhatshot },
  { label: 'محدّثة', href: '/games/?sort=updated', icon: MdUpdate },
]

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
      icon: categoryStyle(slug).icon,
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
