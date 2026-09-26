import { notFound } from 'next/navigation'
import { Info } from 'lucide-react'
import { listSettings } from '@/lib/dashboard/settings'
import { SettingsManager } from '@/components/dashboard/settings-manager'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getTranslations } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

export default async function DashboardSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'Dashboard.settings' })
  const rows = await listSettings()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('title')}</h1>
        <p className="text-sm font-medium text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Alert>
        <Info className="size-4 text-primary" />
        <AlertTitle>{t('howItWorksTitle')}</AlertTitle>
        <AlertDescription>{t('howItWorksDescription')}</AlertDescription>
      </Alert>

      <div className="overflow-hidden rounded-xl border bg-card p-1 sm:p-2">
        <SettingsManager rows={rows} />
      </div>
    </div>
  )
}