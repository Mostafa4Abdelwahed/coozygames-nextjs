import { GamesSection } from '@/components/games-section'
import { ACTION_GAMES, NEW_GAMES, PUZZLE_GAMES, TRENDING_GAMES } from '@/lib/games'

// First visible row of the page: load eagerly and mark the LCP candidate.
const FIRST_ROW = 6

export default function Home() {
  return (
    <div className="flex flex-col gap-6 p-3 sm:gap-8 sm:p-5">
      <GamesSection title="ألعاب رائجة" href="/games/?sort=hot" games={TRENDING_GAMES} priorityCount={FIRST_ROW} />
      <GamesSection title="ألعاب جديدة" href="/games/?sort=new" games={NEW_GAMES} />
      <GamesSection title="ألعاب أكشن" href="/game-category/action/" games={ACTION_GAMES} />
      <GamesSection title="ألعاب بازل" href="/game-category/puzzle/" games={PUZZLE_GAMES} />
    </div>
  )
}
