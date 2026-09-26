import { notFound } from 'next/navigation'
import { Gamepad2, EyeOff, Star, PenLine } from 'lucide-react'
import Image from 'next/image'
import { Pager } from '@/components/pager'
import { listGames, getPlayCounts, type GamesFilters } from '@/lib/dashboard/queries'
import { getOverrides, type GameOverride } from '@/lib/dashboard/overrides'
import { GameOverrideForm } from '@/components/dashboard/game-override-form'
import { FilterSelect, FilterSearch } from '@/components/dashboard/filter-select'
import { CATEGORIES } from '@/lib/categories'
import { thumbUrl } from '@/lib/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getTranslations } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

const STATUS_VALUES = ['hidden', 'featured', 'modified'] as const

type SearchParams = { q?: string; category?: string; status?: string; page?: string }

function parseFilters(sp: SearchParams): GamesFilters {
  const category = CATEGORIES.some((c) => c.slug === sp.category) ? (sp.category ?? '') : ''
  const statuses: string[] = [...STATUS_VALUES]
  const status = statuses.includes(sp.status ?? '') ? (sp.status as GamesFilters['status']) : ''
  return { q: sp.q ?? '', category, status }
}

function pagerParams(filters: GamesFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.q) params.q = filters.q
  if (filters.category) params.category = filters.category
  if (filters.status) params.status = filters.status
  return params
}

function OverrideBadges({
  override,
  labels,
}: {
  override?: GameOverride
  labels: { hidden: string; featured: string; modified: string }
}) {
  if (!override) return null
  return (
    <div className="flex flex-wrap gap-1">
      {override.hidden && (
        <Badge variant="destructive" className="gap-1">
          <EyeOff className="size-3" /> {labels.hidden}
        </Badge>
      )}
      {override.featured && (
        <Badge variant="secondary" className="gap-1 border-amber-500/50 bg-amber-500/10 text-amber-600">
          <Star className="size-3" /> {labels.featured}
        </Badge>
      )}
      {(override.titleAr || override.thumb) && (
        <Badge variant="secondary" className="gap-1 border-primary/40 bg-primary/10 text-primary">
          <PenLine className="size-3" /> {labels.modified}
        </Badge>
      )}
    </div>
  )
}

export default async function DashboardGamesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<SearchParams>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'Dashboard.games' })
  const sp = await searchParams
  const filters = parseFilters(sp)
  const page = parseInt(sp.page ?? '1', 10) || 1
  const overrides = await getOverrides()
  const playCounts = await getPlayCounts()
  const data = listGames(filters, page, overrides)

  const statusFilterOptions = [
    { value: STATUS_VALUES[0], label: t('statusHidden') },
    { value: STATUS_VALUES[1], label: t('statusFeatured') },
    { value: STATUS_VALUES[2], label: t('statusModified') },
  ]

  const overrideLabels = {
    hidden: t('overrideBadgeHidden'),
    featured: t('overrideBadgeFeatured'),
    modified: t('overrideBadgeModified'),
  }

  const categoryOptions = CATEGORIES.map((cat) => ({
    value: cat.slug,
    label: locale === 'ar' ? cat.labelAr : cat.labelEn,
  }))

  const playsLabel = (count: number) => t('playsCount', { count: count.toLocaleString('en-US') })

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('title')}</h1>
        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          {t('totalGames', { total: data.total.toLocaleString('en-US') })}
          {filters.status !== '' && <Badge variant="secondary">{t('filterBadge')}</Badge>}
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <FilterSearch q={filters.q} placeholder={t('searchPlaceholder')} />
        <FilterSelect
          param="category"
          value={CATEGORIES.some((c) => c.slug === filters.category) ? filters.category : ''}
          placeholder={t('categoryAll')}
          ariaLabel={t('category')}
          options={categoryOptions}
        />
        <FilterSelect
          param="status"
          value={filters.status}
          placeholder={t('statusAll')}
          ariaLabel={t('status')}
          options={statusFilterOptions}
        />
      </div>

      {data.rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Gamepad2 className="size-9 text-muted-foreground" />
            <p className="font-medium text-foreground">{t('empty')}</p>
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
                        {locale === 'ar'
                          ? CATEGORIES.find((c) => c.slug === game.category)?.labelAr ?? game.category
                          : CATEGORIES.find((c) => c.slug === game.category)?.labelEn ?? game.category}
                        {' • '}
                        {playsLabel(playCounts[game.slug] ?? 0)}
                      </div>
                      <OverrideBadges override={override} labels={overrideLabels} />
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