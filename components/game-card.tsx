import Link from 'next/link'
import type { Game } from '@/lib/games'

export function GameCard({ game }: { game: Game }) {
  const Icon = game.icon

  return (
    <Link
      href={`/game/${game.slug}/`}
      className="group overflow-hidden rounded-xl bg-night-80 transition duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className={`relative flex aspect-square items-center justify-center bg-linear-to-br ${game.gradient}`}>
        <Icon size={44} className="text-white/85 drop-shadow transition duration-200 group-hover:scale-110" />
        <span className="absolute inset-e-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-bold text-white">
          ★ {game.rating}
        </span>
      </div>
      <div className="p-2.5">
        <h3 className="truncate text-sm font-bold text-white">{game.title}</h3>
        <p className="mt-0.5 truncate text-xs font-semibold text-mist-50">
          {game.category} • {game.plays}
        </p>
      </div>
    </Link>
  )
}
