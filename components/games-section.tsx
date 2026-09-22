import Link from 'next/link'
import type { Game } from '@/lib/games'
import { GameCard } from './game-card'

export function GamesSection({ title, href, games }: { title: string; href: string; games: Game[] }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-white sm:text-xl">{title}</h2>
        <Link href={href} className="text-sm font-bold text-brand-60 transition hover:text-white">
          عرض الكل
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7">
        {games.map((game) => (
          <GameCard key={game.slug} game={game} />
        ))}
      </div>
    </section>
  )
}
