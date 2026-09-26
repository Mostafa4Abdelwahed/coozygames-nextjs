import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { Link } from '@/i18n/navigation'
import {
  ArrowLeft,
  CreditCard,
  Gamepad2,
  KeyRound,
  Link2,
  MonitorSmartphone,
  ScrollText,
  ShieldAlert,
  UserRound,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'
import { auth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ReceiptDialog } from '@/components/dashboard/billing/receipt-dialog'
import { UserManager } from '@/components/dashboard/user-manager'
import { getUserDetail } from '@/lib/dashboard/user-detail'
import { getGameBySlug } from '@/lib/games'
import { formatMoney } from '@/lib/money'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'Dashboard.userDetail' })
  const tCommon = await getTranslations({ locale, namespace: 'Dashboard.common' })
  return {
    title: `${t('title')} | ${tCommon('dashboard')}`,
    robots: { index: false, follow: false },
  }
}

function fmtDate(d: Date | null | undefined): string {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
}

function fmtDateTime(d: Date | null | undefined): string {
  return d
    ? new Date(d).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{children}</dd>
    </div>
  )
}

function SectionCard({
  icon,
  title,
  action,
  children,
}: {
  icon: ReactNode
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            {icon}
            {title}
          </CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="py-8 text-center text-sm text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  )
}

export default async function DashboardUserPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  const t = await getTranslations({ locale, namespace: 'Dashboard.userDetail' })
  const tStatus = await getTranslations({ locale, namespace: 'Dashboard.status' })

  const detail = await getUserDetail(id)
  if (!detail) notFound()

  const session = await auth.api.getSession({ headers: await headers() })
  const isSelf = session?.user.id === detail.account.id

  const { account, subscription } = detail
  const initial = (account.name ?? account.email ?? '?').charAt(0).toUpperCase()

  function providerLabel(providerId: string): string {
    if (providerId === 'credential') return t('providerCredential')
    if (providerId === 'google') return t('providerGoogle')
    return providerId
  }

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary p-5">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
              {account.name || account.email}
            </h1>
            <p className="truncate text-sm text-muted-foreground" dir="ltr">
              {account.email}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant={account.role === 'admin' ? 'default' : 'secondary'}>
                {account.role === 'admin' ? t('roleAdmin') : t('roleUser')}
              </Badge>
              {account.banned ? (
                <Badge variant="destructive" className="gap-1">
                  <ShieldAlert className="size-3" />
                  {t('banned')}
                </Badge>
              ) : (
                <Badge variant="secondary" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600">
                  {t('active')}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/users"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <ArrowLeft className="size-4" />
              {t('back')}
            </Link>
            <UserManager
              userId={account.id}
              role={account.role}
              banned={account.banned}
              isSelf={isSelf}
            />
          </div>
        </CardContent>
      </Card>

      <SectionCard icon={<UserRound className="size-4 text-primary" />} title={t('accountTitle')}>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 pb-4">
          <Field label={t('id')}>
            <span dir="ltr" className="break-all font-mono text-xs">
              {account.id}
            </span>
          </Field>
          <Field label={t('email')}>
            <span dir="ltr">{account.email}</span>{' '}
            <Badge variant={account.emailVerified ? 'secondary' : 'outline'} className="align-middle">
              {account.emailVerified ? t('emailVerified') : t('emailUnverified')}
            </Badge>
          </Field>
          <Field label={t('phone')}>
            {account.phoneNumber ? (
              <>
                <span dir="ltr">{account.phoneNumber}</span>{' '}
                <Badge variant={account.phoneNumberVerified ? 'secondary' : 'outline'} className="align-middle">
                  {account.phoneNumberVerified ? t('phoneVerified') : t('phoneUnverified')}
                </Badge>
              </>
            ) : (
              '—'
            )}
          </Field>
          <Field label={t('role')}>
            {account.role === 'admin' ? t('roleAdmin') : t('roleUser')}
          </Field>
          <Field label={t('joinedAt')}>{fmtDate(account.createdAt)}</Field>
          <Field label={t('updatedAt')}>{fmtDate(account.updatedAt)}</Field>
          {account.banned && <Field label={t('banReason')}>{account.banReason || '—'}</Field>}
          {account.banned && <Field label={t('banExpires')}>{fmtDate(account.banExpires)}</Field>}
        </dl>

        <div className="mt-5 border-t pt-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <KeyRound className="size-3.5 text-muted-foreground" />
            {t('providersTitle')}
          </h3>
          {detail.providers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('noProviders')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {detail.providers.map((p) => (
                <Badge key={`${p.providerId}-${p.accountId}`} variant="outline" className="gap-1">
                  {providerLabel(p.providerId)}
                  <span className="text-muted-foreground" dir="ltr">
                    {fmtDate(p.createdAt)}
                  </span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard icon={<CreditCard className="size-4 text-primary" />} title={t('subscriptionTitle')}>
        {subscription.plan ? (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Field label={t('plan')}>
              <Badge variant="secondary">{subscription.plan}</Badge>
            </Field>
            <Field label={t('startedAt')}>{fmtDate(subscription.startedAt)}</Field>
            <Field label={t('expiresAt')}>{fmtDate(subscription.expiresAt)}</Field>
            <Field label={t('statusHeader')}>
              <Badge variant={subscription.active ? 'default' : 'outline'}>
                {subscription.active ? tStatus('active') : tStatus('expired')}
              </Badge>
            </Field>
            <Field label={t('daysLeft')}>{t('daysValue', { days: subscription.daysLeft })}</Field>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">{t('noSubscription')}</p>
        )}
      </SectionCard>

      <SectionCard
        icon={<CreditCard className="size-4 text-primary" />}
        title={t('paymentsTitle')}
        action={<span className="text-xs font-medium text-muted-foreground">{t('paymentsCount', { total: detail.paymentsTotal })}</span>}
      >
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t('dateHeader')}</TableHead>
                <TableHead>{t('methodHeader')}</TableHead>
                <TableHead>{t('txIdHeader')}</TableHead>
                <TableHead>{t('amountHeader')}</TableHead>
                <TableHead>{t('statusHeader')}</TableHead>
                <TableHead>{t('receiptHeader')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.payments.length === 0 ? (
                <EmptyRow colSpan={6} label={t('noPayments')} />
              ) : (
                detail.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(p.createdAt)}</TableCell>
                    <TableCell className="text-muted-foreground">{p.methodName}</TableCell>
                    <TableCell dir="ltr" className="max-w-36 truncate text-muted-foreground">
                      {p.providerTransactionId}
                    </TableCell>
                    <TableCell className="font-medium">{formatMoney(p.amount, p.currency)}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === 'approved' ? 'default' : p.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {tStatus(p.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ReceiptDialog payment={p} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <SectionCard
        icon={<Gamepad2 className="size-4 text-primary" />}
        title={t('playsTitle')}
        action={
          <span className="text-xs font-medium text-muted-foreground">
            {t('totalPlays')}: {detail.playsTotal} · {t('distinctGames')}: {detail.distinctGames}
          </span>
        }
      >
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t('gameHeader')}</TableHead>
                <TableHead>{t('countryHeader')}</TableHead>
                <TableHead>{t('referrerHeader')}</TableHead>
                <TableHead>{t('whenHeader')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.plays.length === 0 ? (
                <EmptyRow colSpan={4} label={t('noPlays')} />
              ) : (
                detail.plays.map((play) => {
                  const game = getGameBySlug(play.gameSlug)
                  return (
                    <TableRow key={play.id}>
                      <TableCell>
                        <Link href={`/game/${play.gameSlug}/`} className="font-medium text-primary hover:underline">
                          {game?.title ?? play.gameSlug}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{play.country ?? '—'}</TableCell>
                      <TableCell dir="ltr" className="max-w-56 truncate text-muted-foreground" title={play.referrer ?? undefined}>
                        {play.referrer ?? '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDateTime(play.createdAt)}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <SectionCard icon={<Link2 className="size-4 text-primary" />} title={t('linksTitle')}>
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t('noteHeader')}</TableHead>
                <TableHead>{t('daysHeader')}</TableHead>
                <TableHead>{t('usedAtHeader')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.linksUsed.length === 0 ? (
                <EmptyRow colSpan={3} label={t('noLinks')} />
              ) : (
                detail.linksUsed.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-muted-foreground">{l.note || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{l.subscriptionDays}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDateTime(l.usedAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <SectionCard
        icon={<MonitorSmartphone className="size-4 text-primary" />}
        title={t('sessionsTitle')}
        action={<span className="text-xs font-medium text-muted-foreground">{t('activeSessions', { count: detail.activeSessions })}</span>}
      >
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t('deviceHeader')}</TableHead>
                <TableHead>{t('ipHeader')}</TableHead>
                <TableHead>{t('createdAtHeader')}</TableHead>
                <TableHead>{t('expiresAt')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.sessions.length === 0 ? (
                <EmptyRow colSpan={4} label={t('noSessions')} />
              ) : (
                detail.sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell dir="ltr" className="max-w-72 truncate text-muted-foreground" title={s.userAgent || undefined}>
                      {s.userAgent || '—'}
                    </TableCell>
                    <TableCell dir="ltr" className="text-muted-foreground">
                      {s.ipAddress || '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDateTime(s.createdAt)}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDateTime(s.expiresAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <SectionCard icon={<ScrollText className="size-4 text-primary" />} title={t('auditTitle')}>
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t('whenHeader')}</TableHead>
                <TableHead>{t('actionHeader')}</TableHead>
                <TableHead>{t('actorHeader')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.audit.length === 0 ? (
                <EmptyRow colSpan={3} label={t('noAudit')} />
              ) : (
                detail.audit.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDateTime(a.createdAt)}</TableCell>
                    <TableCell>
                      <span dir="ltr" className="font-mono text-xs">
                        {a.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{a.actorName ?? '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  )
}
