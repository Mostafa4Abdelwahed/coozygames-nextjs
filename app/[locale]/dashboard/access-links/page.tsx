import { notFound } from 'next/navigation'
import { CheckCircle2, Link2, TimerOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pager } from '@/components/pager'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { accessLinkStats, listAccessLinks, type AccessLinkStatus } from '@/lib/access-links'
import { AccessLinkForm } from '@/components/dashboard/access-links/access-link-form'
import { AccessLinkActions } from '@/components/dashboard/access-links/access-link-actions'
import { getTranslations } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'Dashboard.accessLinks' })
  const tCommon = await getTranslations({ locale, namespace: 'Dashboard.common' })
  return { title: `${t('title')} | ${tCommon('dashboard')}` }
}

type SearchParams = { page?: string }

export default async function AccessLinksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<SearchParams>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'Dashboard.accessLinks' })
  const tStatus = await getTranslations({ locale, namespace: 'Dashboard.status' })
  const sp = await searchParams
  const page = parseInt(sp.page ?? '1', 10) || 1

  const [stats, list] = await Promise.all([accessLinkStats(), listAccessLinks(page)])

  const cards = [
    { labelKey: 'active', value: stats.active.toLocaleString('en-US'), icon: Link2 },
    { labelKey: 'used', value: stats.used.toLocaleString('en-US'), icon: CheckCircle2 },
    { labelKey: 'expired', value: stats.expired.toLocaleString('en-US'), icon: TimerOff },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('title')}</h1>
        <p className="text-sm font-medium text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map(({ labelKey, value, icon: Icon }) => (
          <Card key={labelKey}>
            <CardHeader className="px-4 pt-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-0.5 px-4 pb-4">
              <span className="text-xl font-bold tracking-tight sm:text-2xl">{value}</span>
              <span className="text-xs font-medium text-muted-foreground">{t(labelKey)}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="size-4 text-primary" />
            {t('createTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AccessLinkForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span>{t('listTitle')}</span>
            {list.total > 0 && <Badge variant="secondary">{list.total}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('note')}</TableHead>
                  <TableHead>{t('days')}</TableHead>
                  <TableHead>{t('token')}</TableHead>
                  <TableHead>{t('validity')}</TableHead>
                  <TableHead>{t('usedBy')}</TableHead>
                  <TableHead>{t('created')}</TableHead>
                  <TableHead>{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                      {t('empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  list.rows.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <StatusBadge status={l.status} tStatus={tStatus} />
                      </TableCell>
                      <TableCell className="max-w-44">
                        <span className="block truncate" title={l.note}>
                          {l.note || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{t('daysValue', { days: l.subscriptionDays })}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground" dir="ltr" title={l.token}>
                          {l.token.slice(0, 12)}…
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {l.expiresAt ? (
                          l.expiresAt.toLocaleDateString('en-US')
                        ) : (
                          <span className="text-muted-foreground/70">{t('noExpiry')}</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-40">
                        {l.usedByName ? (
                          <>
                            <div className="truncate font-medium text-foreground">{l.usedByName}</div>
                            <div className="truncate text-xs text-muted-foreground" dir="ltr">
                              {l.usedByEmail}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {l.createdAt.toLocaleDateString('en-US')}
                      </TableCell>
                      <TableCell>
                        <AccessLinkActions token={l.token} used={l.status === 'used'} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <Pager page={page} totalPages={list.pages} basePath="/dashboard/access-links/" />
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({
  status,
  tStatus,
}: {
  status: AccessLinkStatus
  tStatus: (key: string) => string
}) {
  const meta: Record<AccessLinkStatus, string> = {
    active: 'bg-emerald-500/15 text-emerald-600',
    used: 'bg-sky-500/15 text-sky-600',
    expired: 'bg-amber-500/15 text-amber-600',
  }
  return (
    <Badge variant="secondary" className={meta[status]}>
      {tStatus(status)}
    </Badge>
  )
}