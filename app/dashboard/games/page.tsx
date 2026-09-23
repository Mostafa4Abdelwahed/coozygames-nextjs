import { MdSearch, MdVideogameAsset } from 'react-icons/md'
import Image from 'next/image'
import { Pager } from '@/components/pager'
import { listGames, type GamesFilters } from '@/lib/dashboard/queries'
import { CATEGORIES } from '@/lib/categories'
import { thumbUrl } from '@/lib/image'

const INPUT_STYLE =
  'h-10 rounded-xl border border-night-60 bg-night-80 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-mist-30 focus:border-brand-60'
const SELECT_STYLE =
  'h-10 rounded-xl border border-night-60 bg-night-80 px-2 text-sm font-semibold text-mist-50 outline-none transition focus:border-brand-60'

type SearchParams = { q?: string; category?: string; page?: string }

function parseFilters(sp: SearchParams): GamesFilters {
  const category = CATEGORIES.some((c) => c.slug === sp.category) ? (sp.category ?? '') : ''
  return { q: sp.q ?? '', category }
}

function pagerParams(filters: GamesFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.q) params.q = filters.q
  if (filters.category) params.category = filters.category
  return params
}

export default async function DashboardGamesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const filters = parseFilters(sp)
  const page = parseInt(sp.page ?? '1', 10) || 1
  const data = listGames(filters, page)

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
        <select
          name="category"
          defaultValue={filters.category}
          aria-label="التصنيف"
          className={SELECT_STYLE}
        >
          <option value="">كل التصنيفات</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.labelAr}
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {data.rows.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-2 py-16 text-center">
            <MdVideogameAsset size={40} className="text-mist-50" />
            <p className="font-bold text-white">لا توجد ألعاب مطابقة</p>
          </div>
        ) : (
          data.rows.map((game) => (
            <div
              key={game.slug}
              className="flex flex-col gap-2 rounded-2xl border border-night-60 bg-night-80 p-2.5"
            >
              <Image
                src={thumbUrl(game.thumb, 300) ?? ''}
                alt={game.title}
                width={300}
                height={169}
                sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 49vw"
                className="aspect-video w-full rounded-xl object-cover"
              />
              <div className="px-1 pb-1">
                <div className="truncate text-sm font-extrabold text-white" title={game.title}>
                  {game.title}
                </div>
                <div className="mt-0.5 flex items-center justify-between text-xs font-bold text-mist-50">
                  <span>{game.category}</span>
                  <span>{game.plays}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Pager
        page={data.page}
        totalPages={data.pages}
        basePath="/dashboard/games/"
        params={pagerParams(filters)}
      />
    </div>
  )
}