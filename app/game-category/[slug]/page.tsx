import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MdVideogameAsset } from 'react-icons/md'
import { CATEGORIES, getCategory } from '@/lib/categories'
import { getGamesByCategory } from '@/lib/games'
import { GameCard } from '@/components/game-card'

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const category = getCategory(slug)
  return { title: category ? `${category.label} | Coozy Games` : 'Coozy Games' }
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = getCategory(slug)
  if (!category) notFound()

  const games = getGamesByCategory(slug)
  const Icon = category.icon

  return (
    <div className="flex flex-col gap-6 p-3 sm:gap-8 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-night-80 text-brand-60">
          <Icon size={26} />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold text-white sm:text-2xl">{category.label}</h1>
          <p className="text-sm font-semibold text-mist-50">{games.length} لعبة</p>
        </div>
      </div>

      {games.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <MdVideogameAsset size={40} className="text-mist-50" />
          <p className="font-bold text-white">لا توجد ألعاب هنا بعد</p>
          <p className="text-sm text-mist-50">جرّب تصنيفًا آخر من القائمة الجانبية</p>
        </div>
      )}
    </div>
  )
}
