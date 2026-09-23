import { Search, Gamepad2, EyeOff, Star, PenLine } from 'lucide-react'
import Image from 'next/image'
import { Pager } from '@/components/pager'
import { listGames, getPlayCounts, type GamesFilters } from '@/lib/dashboard/queries'
import { getOverrides, type GameOverride } from '@/lib/dashboard/overrides'
import { GameOverrideForm } from '@/components/dashboard/game-override-form'
import { CATEGORIES } from '@/lib/categories'
import { thumbUrl } from '@/lib/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

const FILTER_SELECT_STYLE =
  'h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm whitespace-nowrap outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50'

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
        <Badge variant="destructive" className="gap-1">
          <EyeOff className="size-3" /> مخفية
        </Badge>
      )}
      {override.featured && (
        <Badge variant="secondary" className="gap-1 border-amber-500/50 bg-amber-500/10 text-amber-400">
          <Star className="size-3" /> مميّزة
        </Badge>
      )}
      {(override.titleAr || override.thumb) && (
        <Badge variant="secondary" className="gap-1 border-primary/40 bg-primary/10 text-primary">
          <PenLine className="size-3" /> معدّلة
        </Badge>
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">الألعاب</h1>
        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          {data.total.toLocaleString('en-US')} لعبة
          {filters.status !== '' && <Badge variant="secondary">مفلتر</Badge>}
        </p>
      </div>

      <form
        action="/dashboard/games/"
        method="get"
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
      >
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="بحث بالاسم"
            className="h-9 ps-9"
          />
        </div>
        <select name="category" defaultValue={filters.category} aria-label="التصنيف" className={FILTER_SELECT_STYLE}>
          <option value="">كل التصنيفات</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.labelAr}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={filters.status} aria-label="الحالة" className={FILTER_SELECT_STYLE}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button type="submit" className="h-9">
          عرض
        </Button>
      </form>

      {data.rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Gamepad2 className="size-9 text-muted-foreground" />
            <p className="font-medium text-foreground">لا توجد ألعاب مطابقة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.rows.map((game) => {
            const override = overrides[game.slug]
            return (
              <Card key={game.slug} className="gap-0 p-3">
                <CardContent className="flex flex-col gap-3 p-0">
                  <div className="flex gap-3">
                    <Image
                      src={thumbUrl(game.thumb, 300) ?? ''}
                      alt={game.title}
                      width={300}
                      height={169}
                      sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 100vw"
                      className="h-24 w-36 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="truncate text-sm font-medium text-foreground" title={game.title}>
                        {game.title}
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">
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
                </CardContent>
              </Card>
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