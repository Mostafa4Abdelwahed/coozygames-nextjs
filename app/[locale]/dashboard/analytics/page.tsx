import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { BarChart3, Users, Gamepad2, Clock3, TrendingUp, Folder } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAnalytics } from '@/lib/dashboard/queries'
import { getTranslations, getLocale } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

function formatDay(day: string, locale: string): string {
  const date = new Date(`${day}T00:00:00Z`)
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
  }).format(date)
}

function formatUsers(count: number): string {
  const formatted = count.toLocaleString('en-US')
  return formatted
}

function BarRow({ label, sub, count, max }: { label: string; sub?: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate font-medium text-foreground" title={label}>
          {label}
        </span>
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">
          {count.toLocaleString('en-US')}
          {sub ? <span className="text-muted-foreground"> {sub}</span> : null}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </div>
  )
}

export default async function AnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'Dashboard.analytics' })
  const localeTag = await getLocale()
  const data = await getAnalytics()
  const { overview } = data

  const cards = [
    { labelKey: 'totalPlays', value: overview.total.toLocaleString('en-US'), icon: Gamepad2 },
    { labelKey: 'last24h', value: overview.last24h.toLocaleString('en-US'), icon: Clock3 },
    { labelKey: 'last7d', value: overview.last7d.toLocaleString('en-US'), icon: TrendingUp },
    { labelKey: 'last30d', value: overview.last30d.toLocaleString('en-US'), icon: Clock3 },
  ]

  const maxTop = Math.max(...data.topGames.map((g) => g.plays), 1)
  const maxCat = Math.max(...data.topCategories.map((c) => c.plays), 1)
  const maxHour = Math.max(...data.hourly.map((h) => h.count), 1)
  const maxDau = Math.max(...data.dau.map((d) => d.plays), 1)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('title')}</h1>
        <p className="text-sm font-medium text-muted-foreground">{t('subtitle')}</p>
      </div>

      {overview.total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <BarChart3 className="size-9 text-muted-foreground" />
            <p className="font-medium text-foreground">{t('noData')}</p>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cards.map(({ labelKey, value, icon: Icon }) => (
              <Card key={labelKey}>
                <CardHeader className="px-4 pt-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col gap-0.5 px-4 pb-4">
                  <span className="text-2xl font-bold tracking-tight">{value}</span>
                  <span className="text-xs font-medium text-muted-foreground">{t(labelKey)}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  {t('topGames7d')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {data.topGames.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noPlaysLast7d')}</p>
                ) : (
                  data.topGames.map((g) => (
                    <BarRow key={g.slug} label={g.title} count={g.plays} max={maxTop} />
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="size-4 text-primary" />
                  {t('topCategories7d')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {data.topCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noPlaysLast7d')}</p>
                ) : (
                  data.topCategories.map((c) => (
                    <BarRow key={c.slug} label={c.labelAr} count={c.plays} max={maxCat} />
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  {t('dau14d')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {data.dau.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noData')}</p>
                ) : (
                  data.dau.map((d) => (
                    <BarRow
                      key={d.day}
                      label={formatDay(d.day, localeTag)}
                      sub={formatUsers(d.users)}
                      count={d.plays}
                      max={maxDau}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock3 className="size-4 text-primary" />
                  {t('hourly7d')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {data.hourly.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noData')}</p>
                ) : (
                  data.hourly.map((h) => (
                    <BarRow
                      key={h.hour}
                      label={`${String(h.hour).padStart(2, '0')}:00`}
                      count={h.count}
                      max={maxHour}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{t('gameLabel')}:</span>
            {data.topGames.slice(0, 6).map((g) => (
              <Link
                key={g.slug}
                href={`/game/${g.slug}/`}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                {g.title}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}