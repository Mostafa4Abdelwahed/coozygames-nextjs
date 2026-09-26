import { notFound } from 'next/navigation'
import { Banknote, CheckCheck, Clock3, WalletCards, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pager } from '@/components/pager'
import { FilterSelect } from '@/components/dashboard/filter-select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  billingSummary,
  DEFAULT_MONTHLY_PRICE,
  getMonthlyPrice,
  listPaymentMethods,
  listPaymentsForAdmin,
  type PaymentStatus,
} from '@/lib/billing'
import { getSetting } from '@/lib/dashboard/settings'
import { formatMoney } from '@/lib/money'
import { PriceForm } from '@/components/dashboard/billing/price-form'
import { PaymentMethodsManager } from '@/components/dashboard/billing/payment-methods-manager'
import { ReceiptDialog } from '@/components/dashboard/billing/receipt-dialog'
import { getTranslations } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'Dashboard.billing' })
  const tCommon = await getTranslations({ locale, namespace: 'Dashboard.common' })
  return { title: `${t('title')} | ${tCommon('dashboard')}` }
}

type SearchParams = { status?: string; page?: string }

function parseStatus(raw?: string): 'all' | PaymentStatus {
  return raw === 'pending' || raw === 'approved' || raw === 'rejected' ? raw : 'all'
}

function pagerParams(status: 'all' | PaymentStatus): Record<string, string> {
  return status === 'all' ? {} : { status }
}

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<SearchParams>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'Dashboard.billing' })
  const tStatus = await getTranslations({ locale, namespace: 'Dashboard.status' })
  const sp = await searchParams
  const status = parseStatus(sp.status)
  const page = parseInt(sp.page ?? '1', 10) || 1

  const [summary, list, methods, price, currentPrice] = await Promise.all([
    billingSummary(),
    listPaymentsForAdmin(status, page),
    listPaymentMethods(true),
    getMonthlyPrice(),
    getSetting('PREMIUM_MONTHLY_PRICE'),
  ])

  const cards = [
    { labelKey: 'pending', value: summary.pending.toLocaleString('en-US'), icon: Clock3 },
    { labelKey: 'approvedThisMonth', value: summary.approvedThisMonth.toLocaleString('en-US'), icon: CheckCheck },
    { labelKey: 'revenueThisMonth', value: formatMoney(summary.revenueThisMonth, 'EGP'), icon: Banknote },
    { labelKey: 'activeSubscribers', value: summary.activeSubscribers.toLocaleString('en-US'), icon: Wallet },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('title')}</h1>
        <p className="text-sm font-medium text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('priceCardTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceForm current={currentPrice ?? String(DEFAULT_MONTHLY_PRICE)} price={price} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <WalletCards className="size-4 text-primary" />
              {t('manageMethods')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentMethodsManager methods={methods} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span>{t('paymentRequests')}</span>
              {status !== 'all' && <Badge variant="secondary">{t('filterBadge')}</Badge>}
            </CardTitle>
            <FilterSelect
              param="status"
              value={status === 'all' ? '' : status}
              placeholder={t('statusAll')}
              ariaLabel={t('statusAria')}
              options={[
                { value: 'pending', label: t('statusPending') },
                { value: 'approved', label: t('statusApproved') },
                { value: 'rejected', label: t('statusRejected') },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t('userHeader')}</TableHead>
                  <TableHead>{t('methodHeader')}</TableHead>
                  <TableHead>{t('amountHeader')}</TableHead>
                  <TableHead>{t('txIdHeader')}</TableHead>
                  <TableHead>{t('statusHeader')}</TableHead>
                  <TableHead>{t('dateHeader')}</TableHead>
                  <TableHead>{t('actionsHeader')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      {t('empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  list.rows.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">{p.userName || '—'}</div>
                        <div className="text-xs text-muted-foreground" dir="ltr">
                          {p.userEmail}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.methodName}</TableCell>
                      <TableCell className="font-medium">{formatMoney(p.amount, p.currency)}</TableCell>
                      <TableCell dir="ltr" className="max-w-36 truncate text-muted-foreground">
                        {p.providerTransactionId}
                      </TableCell>
                      <TableCell>
                        <StatusCell p={p} tStatus={tStatus} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {p.createdAt.toLocaleDateString('en-US')}
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

          <Pager page={page} totalPages={list.pages} basePath="/dashboard/billing/" params={pagerParams(status)} />
        </CardContent>
      </Card>
    </div>
  )
}

function StatusCell({
  p,
  tStatus,
}: {
  p: { status: PaymentStatus; adminNote: string | null }
  tStatus: (key: string) => string
}) {
  const meta: Record<PaymentStatus, string> = {
    pending: 'bg-amber-500/15 text-amber-600',
    approved: 'bg-emerald-500/15 text-emerald-600',
    rejected: 'bg-red-500/10 text-red-600',
  }
  return (
    <div className="flex flex-col gap-0.5">
      <Badge variant="secondary" className={meta[p.status]}>
        {tStatus(p.status)}
      </Badge>
      {p.adminNote && (
        <span className="max-w-36 truncate text-xs text-muted-foreground" title={p.adminNote}>
          {p.adminNote}
        </span>
      )}
    </div>
  )
}