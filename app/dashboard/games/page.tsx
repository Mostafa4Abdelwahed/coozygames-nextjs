import { MdSearch, MdVideogameAsset, MdVisibility, MdStar, MdEditNote } from 'react-icons/md'
import Image from 'next/image'
import { Pager } from '@/components/pager'
import { listGames, getPlayCounts, type GamesFilters } from '@/lib/dashboard/queries'
import { getOverrides, type GameOverride } from '@/lib/dashboard/overrides'
import { GameOverrideForm } from '@/components/dashboard/game-override-form'
import { CATEGORIES } from '@/lib/categories'
import { thumbUrl } from '@/lib/image'

const INPUT_STYLE =
  'h-10 rounded-xl border border-night-60 bg-night-80 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-mist-30 focus:border-brand-60'
const SELECT_STYLE =
  'h-10 rounded-xl border border-night-60 bg-night-80 px-2 text-sm font-semibold text-mist-50 outline-none transition focus:border-brand-60'

const STATUS_OPTIONS = [
  { value: '', label: 'كل الألعاب' },
  { value: 'hidden', label: 'مخفية' },
  { value: 'featured', label: 'مميّزة' },
  { value: 'modified', label: 'معدّلة' },
] as const

type SearchParams = { q?: string; category?: string; status?: string; page?: string }

function parseFilters(sp: SearchParams): GamesFilters {
  const category = CATEGORIES.some((c) => c.slug === sp.category) ? (sp.category ?? '') : ''
  const statuses = STATUS_OPTIONS.map((o) => o.value)
  const status = (statuses as string[]).includes(sp.status ?? '') ? (sp.status as GamesFilters['status']) : ''
  return { q: sp.q ?? '', category, status }
}

function pagerParams(filters: GamesFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.q) params.q = filters.q
  if (filters.category) params.category = filters.category
  if (filters.status) params.status = filters.status
  return params
}

function OverrideBadges({ override }: { override?: GameOverride }) {
  if (!override) return null
  return (
    <div className="flex flex-wrap gap-1">
      {override.hidden && (
        <span className="flex items-center gap-0.5 rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-extrabold text-red-400">
          <MdVisibility size={11} />
          مخفية
        </span>
      )}
      {override.featured && (
        <span className="flex items-center gap-0.5 rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-extrabold text-amber-400">
          <MdStar size={11} />
          مميّزة
        </span>
      )}
      {(override.titleAr || override.thumb) && (
        <span className="flex items-center gap-0.5 rounded-full bg-brand-100/20 px-2 py-0.5 text-[11px] font-extrabold text-brand-60">
          <MdEditNote size={11} />
          معدّلة
        </span>
      )}
    </div>
  )
}

export default async function DashboardGamesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const filters = parseFilters(sp)
  const page = parseInt(sp.page ?? '1', 10) || 1
  const overrides = await getOverrides()
  const playCounts = await getPlayCounts()
  const data = listGames(filters, page, overrides)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-extrabold text-white sm:text-2xl">الألعاب</h1>
        <p className="mt-1 text-sm font-semibold text-mist-50">
          {data.total.toLocaleString('en-US')} لعبة
        </p>
      </div>

      <form
        action="/dashboard/games/"
        method="get"
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
      >
        <div className="relative min-w-0 flex-1">
          <MdSearch
            size={18}
            className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-mist-50"
          />
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="بحث بالاسم"
            className={`${INPUT_STYLE} w-full ps-10`}
          />
        </div>
        <select name="category" defaultValue={filters.category} aria-label="التصنيف" className={SELECT_STYLE}>
          <option value="">كل التصنيفات</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.labelAr}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={filters.status} aria-label="الحالة" className={SELECT_STYLE}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-10 rounded-xl bg-brand-100 px-5 text-sm font-extrabold text-white transition hover:bg-brand-80"
        >
          عرض
        </button>
      </form>

      {data.rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <MdVideogameAsset size={40} className="text-mist-50" />
          <p className="font-bold text-white">لا توجد ألعاب مطابقة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.rows.map((game) => {
            const override = overrides[game.slug]
            return (
              <div
                key={game.slug}
                className="flex flex-col gap-2 rounded-2xl border border-night-60 bg-night-80 p-2.5"
              >
                <div className="flex gap-3">
                  <Image
                    src={thumbUrl(game.thumb, 300) ?? ''}
                    alt={game.title}
                    width={300}
                    height={169}
                    sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 100vw"
                    className="h-24 w-36 shrink-0 rounded-xl object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="truncate text-sm font-extrabold text-white" title={game.title}>
                      {game.title}
                    </div>
                    <div className="text-xs font-bold text-mist-50">
                      {game.category} • {playCounts[game.slug]?.toLocaleString('en-US') ?? 0} لعب
                    </div>
                    <OverrideBadges override={override} />
                  </div>
                </div>
                <GameOverrideForm
                  slug={game.slug}
                  initial={{
                    hidden: override?.hidden ?? false,
                    featured: override?.featured ?? false,
                    sortWeight: override?.sortWeight ?? 0,
                    titleAr: override?.titleAr ?? null,
                    thumb: override?.thumb ?? null,
                  }}
                />
              </div>
            )
          })}
        </div>
      )}

      <Pager
        page={data.page}
        totalPages={data.pages}
        basePath="/dashboard/games/"
        params={pagerParams(filters)}
      />
    </div>
  )
}