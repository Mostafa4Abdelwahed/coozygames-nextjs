import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MdCategory, MdChevronLeft, MdHome, MdPlayArrow, MdStar, MdVideogameAsset } from 'react-icons/md'
import { allGameSlugs, getGameBySlug, getGamesByCategory } from '@/lib/games'
import { applyGameOverride, applyOverrides, getPublicOverrides } from '@/lib/dashboard/overrides'
import { categoryLabelAr } from '@/lib/category-meta'
import { HEADER_THUMB_WIDTH, thumbUrl } from '@/lib/image'
import { GameCard } from '@/components/game-card'
import { GamePoster } from '@/components/game-poster'

// Prerender every game page: no per-request data is needed, so these are
// static HTML (CDN-cacheable, cheap prefetch). Unknown slugs still 404 on demand.
export function generateStaticParams() {
  return allGameSlugs().map((slug) => ({ slug }))
}
import Image from 'next/image'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const game = getGameBySlug(slug)
  if (!game) return { title: 'Coozy Games' }
  const overrides = await getPublicOverrides()
  const merged = applyGameOverride(game, overrides)
  return { title: `${merged.title} | Coozy Games` }
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const game = getGameBySlug(slug)
  if (!game) notFound()

  const overrides = await getPublicOverrides()
  const merged = applyGameOverride(game, overrides)
  const catSlug = game.categorySlug
  const related = applyOverrides(
    getGamesByCategory(catSlug).filter((g) => g.slug !== game.slug),
    overrides,
  ).slice(0, 12)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-3 sm:gap-8 sm:p-5">
      <nav aria-label="مسار التنقل" className="flex items-center gap-1 text-sm font-semibold text-mist-50">
        <Link href="/" className="flex items-center gap-1 transition hover:text-white">
          <MdHome size={16} />
          الرئيسية
        </Link>
        <MdChevronLeft size={16} />
        <Link href={`/game-category/${catSlug}/`} className="transition hover:text-white">
          {categoryLabelAr(catSlug, game.category)}
        </Link>
        <MdChevronLeft size={16} />
        <span className="truncate text-white">{merged.title}</span>
      </nav>

      <div className="flex items-center gap-3 sm:gap-4">
        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-night-80 sm:h-20 sm:w-20">
          {merged.thumb ? (
            <Image src={thumbUrl(merged.thumb, HEADER_THUMB_WIDTH) as string} alt={merged.title} width={160} height={160} sizes="80px" decoding="async" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-brand-60">
              <game.icon size={36} />
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold text-white sm:text-2xl">{merged.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-mist-50 sm:text-sm">
            <span className="flex flex-wrap items-center gap-1.5">
              <MdCategory size={15} />
              {game.categories.map((cat) => (
                <Link key={cat.slug} href={`/game-category/${cat.slug}/`} className="rounded-full bg-night-60 px-2.5 py-0.5 transition hover:bg-brand-100 hover:text-white">
                  {categoryLabelAr(cat.slug, cat.label)}
                </Link>
              ))}
            </span>
            <span className="flex items-center gap-1">
              <MdPlayArrow size={15} />
              {game.plays} لعب
            </span>
            <span className="flex items-center gap-1">
              <MdStar size={15} className="text-amber-400" />
              {game.rating}
            </span>
          </div>
        </div>
      </div>

      <GamePoster slug={game.slug} title={merged.title} thumb={merged.thumb} />

      {related.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <MdVideogameAsset size={22} className="text-brand-60" />
            <h2 className="text-lg font-extrabold text-white sm:text-xl">ألعاب مشابهة</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
            {related.map((g) => (
              <GameCard key={g.slug} game={g} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
