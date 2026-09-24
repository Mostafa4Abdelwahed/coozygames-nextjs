import { CheckCircle2, Link2, TimerOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pager } from '@/components/pager'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { accessLinkStats, listAccessLinks, type AccessLinkStatus } from '@/lib/access-links'
import { formatDateAr } from '@/lib/money'
import { AccessLinkForm } from '@/components/dashboard/access-links/access-link-form'
import { AccessLinkActions } from '@/components/dashboard/access-links/access-link-actions'

export const metadata = { title: 'روابط الوصول | لوحة التحكم' }

type SearchParams = { page?: string }

export default async function AccessLinksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const page = parseInt(sp.page ?? '1', 10) || 1

  const [stats, list] = await Promise.all([accessLinkStats(), listAccessLinks(page)])

  const cards = [
    { label: 'رابط متاح', value: stats.active.toLocaleString('en-US'), icon: Link2 },
    { label: 'روابط مستخدمة', value: stats.used.toLocaleString('en-US'), icon: CheckCircle2 },
    { label: 'روابط منتهية', value: stats.expired.toLocaleString('en-US'), icon: TimerOff },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">روابط الوصول</h1>
        <p className="text-sm font-medium text-muted-foreground">
          إنشاء روابط استخدام واحد تمنح اشتراكًا فعّالًا — يفتحها الزبون، يكمل بياناته، ويُحرق الرابط تلقائيًا
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="size-4 text-primary" />
            إنشاء رابط وصول
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AccessLinkForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span>الروابط</span>
            {list.total > 0 && <Badge variant="secondary">{list.total}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>الحالة</TableHead>
                  <TableHead>الملاحظة</TableHead>
                  <TableHead>أيام</TableHead>
                  <TableHead>الرابط</TableHead>
                  <TableHead>الصلاحية</TableHead>
                  <TableHead>استُخدم بواسطة</TableHead>
                  <TableHead>أُنشئ</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                      لا توجد روابط بعد — أنشئ أول رابط من الأعلى
                    </TableCell>
                  </TableRow>
                ) : (
                  list.rows.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <StatusBadge status={l.status} />
                      </TableCell>
                      <TableCell className="max-w-44">
                        <span className="block truncate" title={l.note}>
                          {l.note || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{l.subscriptionDays} يوم</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground" dir="ltr" title={l.token}>
                          {l.token.slice(0, 12)}…
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {l.expiresAt ? formatDateAr(l.expiresAt) : <span className="text-muted-foreground/70">بدون</span>}
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
                      <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateAr(l.createdAt)}</TableCell>
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

function StatusBadge({ status }: { status: AccessLinkStatus }) {
  const meta: Record<AccessLinkStatus, string> = {
    active: 'bg-emerald-500/15 text-emerald-600',
    used: 'bg-sky-500/15 text-sky-600',
    expired: 'bg-amber-500/15 text-amber-600',
  }
  const label: Record<AccessLinkStatus, string> = { active: 'متاح', used: 'مستخدم', expired: 'منتهي' }
  return (
    <Badge variant="secondary" className={meta[status]}>
      {label[status]}
    </Badge>
  )
}