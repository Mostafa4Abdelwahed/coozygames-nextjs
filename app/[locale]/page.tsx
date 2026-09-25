import { GamesSection } from '@/components/games-section'
import { ACTION_GAMES, NEW_GAMES, PUZZLE_GAMES, TRENDING_GAMES } from '@/lib/games'
import { applyOverrides, getPublicOverrides } from '@/lib/dashboard/overrides'

// First visible row of the page: load eagerly and mark the LCP candidate.
const FIRST_ROW = 6

export default async function Home() {
  const overrides = await getPublicOverrides()

  return (
    <div className="flex flex-col gap-6 p-3 sm:gap-8 sm:p-5">
      <GamesSection title="ألعاب رائجة" href="/games/?sort=hot" games={applyOverrides(TRENDING_GAMES, overrides)} priorityCount={FIRST_ROW} />
      <GamesSection title="ألعاب جديدة" href="/games/?sort=new" games={applyOverrides(NEW_GAMES, overrides)} />
      <GamesSection title="ألعاب أكشن" href="/game-category/action/" games={applyOverrides(ACTION_GAMES, overrides)} />
      <GamesSection title="ألعاب بازل" href="/game-category/puzzle/" games={applyOverrides(PUZZLE_GAMES, overrides)} />
    </div>
  )
}
