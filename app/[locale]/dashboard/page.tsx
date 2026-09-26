import { notFound } from 'next/navigation'
import { Users, Activity, Gamepad2, Tags, Play, Timer } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getDashboardCounts } from '@/lib/dashboard/queries'
import { getTranslations } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

export default async function DashboardOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'Dashboard.overview' })
  const counts = await getDashboardCounts()

  const cards = [
    { labelKey: 'users', value: counts.users.toLocaleString('en-US'), icon: Users },
    { labelKey: 'activeSessions', value: counts.activeSessions.toLocaleString('en-US'), icon: Activity },
    { labelKey: 'plays24h', value: counts.plays24h.toLocaleString('en-US'), icon: Play },
    { labelKey: 'playsTotal', value: counts.playsTotal.toLocaleString('en-US'), icon: Timer },
    { labelKey: 'games', value: counts.games.toLocaleString('en-US'), icon: Gamepad2 },
    { labelKey: 'categories', value: counts.categories.toLocaleString('en-US'), icon: Tags },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('title')}</h1>
        <p className="text-sm font-medium text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
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
    </div>
  )
}