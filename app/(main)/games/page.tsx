import Link from 'next/link'
import type { Metadata } from 'next'
import { ALL_GAMES, NEW_GAMES, TRENDING_GAMES } from '@/lib/games'
import { GameCard } from '@/components/game-card'

export const metadata: Metadata = {
  title: 'الألعاب | Coozy Games',
}

const SORTS = [
  { key: 'hot', label: 'ألعاب رائجة' },
  { key: 'new', label: 'جديد' },
  { key: 'updated', label: 'محدّثة' },
] as const

type SortKey = (typeof SORTS)[number]['key']

function isSortKey(value: string | undefined): value is SortKey {
  return SORTS.some((s) => s.key === value)
}

export default async function GamesPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const { sort } = await searchParams
  const activeSort: SortKey = isSortKey(sort) ? sort : 'hot'

  const games = activeSort === 'new' ? NEW_GAMES : activeSort === 'updated' ? ALL_GAMES : TRENDING_GAMES
  const activeLabel = SORTS.find((s) => s.key === activeSort)?.label ?? ''

  return (
    <div className="flex flex-col gap-6 p-3 sm:gap-8 sm:p-5">
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-extrabold text-white sm:text-2xl">{activeLabel}</h1>
        <div className="flex gap-2">
          {SORTS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.key === 'hot' ? '/games/' : `/games/?sort=${tab.key}`}
              aria-current={tab.key === activeSort ? 'page' : undefined}
              className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                tab.key === activeSort
                  ? 'bg-brand-100 text-white'
                  : 'bg-night-80 text-mist-50 hover:text-white'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {games.map((game) => (
          <GameCard key={game.slug} game={game} />
        ))}
      </div>
    </div>
  )
}
