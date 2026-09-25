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
import { formatDateAr, formatMoney } from '@/lib/money'
import { PriceForm } from '@/components/dashboard/billing/price-form'
import { PaymentMethodsManager } from '@/components/dashboard/billing/payment-methods-manager'
import { ReceiptDialog } from '@/components/dashboard/billing/receipt-dialog'

export const metadata = { title: 'الفواتير | لوحة التحكم' }

type SearchParams = { status?: string; page?: string }

function parseStatus(raw?: string): 'all' | PaymentStatus {
  return raw === 'pending' || raw === 'approved' || raw === 'rejected' ? raw : 'all'
}

function pagerParams(status: 'all' | PaymentStatus): Record<string, string> {
  return status === 'all' ? {} : { status }
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
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
    { label: 'طلبات معلّقة', value: summary.pending.toLocaleString('en-US'), icon: Clock3 },
    { label: 'موافقات هذا الشهر', value: summary.approvedThisMonth.toLocaleString('en-US'), icon: CheckCheck },
    { label: 'إيراد هذا الشهر', value: formatMoney(summary.revenueThisMonth, 'EGP'), icon: Banknote },
    { label: 'مشتركين نشطين', value: summary.activeSubscribers.toLocaleString('en-US'), icon: Wallet },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">الفواتير والاشتراكات</h1>
        <p className="text-sm font-medium text-muted-foreground">
          مراجعة الدفعات اليدوية، سعر الخطة الشهرية، وطرق الدفع
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="px-4 pt-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-0.5 px-4 pb-4">
              <span className="text-xl font-bold tracking-tight sm:text-2xl">{value}</span>
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">سعر الخطة الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceForm current={currentPrice ?? String(DEFAULT_MONTHLY_PRICE)} price={price} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <WalletCards className="size-4 text-primary" />
              طرق الدفع
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
              <span>طلبات الدفع</span>
              {status !== 'all' && <Badge variant="secondary">مفلتر</Badge>}
            </CardTitle>
            <FilterSelect
              param="status"
              value={status === 'all' ? '' : status}
              placeholder="كل الحالات"
              ariaLabel="حالة الدفعة"
              options={[
                { value: 'pending', label: 'معلّقة' },
                { value: 'approved', label: 'موافَق' },
                { value: 'rejected', label: 'مرفوض' },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الطريقة</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>رقم العملية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      لا توجد دفعات مطابقة
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
                        <StatusCell p={p} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateAr(p.createdAt)}
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

function StatusCell({ p }: { p: { status: PaymentStatus; adminNote: string | null } }) {
  const meta: Record<PaymentStatus, string> = {
    pending: 'bg-amber-500/15 text-amber-600',
    approved: 'bg-emerald-500/15 text-emerald-600',
    rejected: 'bg-red-500/10 text-red-600',
  }
  return (
    <div className="flex flex-col gap-0.5">
      <Badge variant="secondary" className={meta[p.status]}>
        {p.status === 'pending' ? 'معلّقة' : p.status === 'approved' ? 'موافَق' : 'مرفوض'}
      </Badge>
      {p.adminNote && (
        <span className="max-w-36 truncate text-xs text-muted-foreground" title={p.adminNote}>
          {p.adminNote}
        </span>
      )}
    </div>
  )
}