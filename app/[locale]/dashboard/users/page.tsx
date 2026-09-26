import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { UserPlus } from 'lucide-react'
import { Pager } from '@/components/pager'
import { listUsers, type UserFilters } from '@/lib/dashboard/queries'
import { auth } from '@/lib/auth'
import { UserManager } from '@/components/dashboard/user-manager'
import { FilterSelect, FilterSearch } from '@/components/dashboard/filter-select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getTranslations } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

type SearchParams = { q?: string; role?: string; banned?: string; page?: string }

function parseFilters(sp: SearchParams): UserFilters {
  const role = sp.role === 'admin' || sp.role === 'user' ? sp.role : ''
  const banned = sp.banned === 'banned' || sp.banned === 'active' ? sp.banned : 'all'
  return { q: sp.q ?? '', role, banned }
}

function formatDate(iso: Date): string {
  return iso.toISOString().slice(0, 10)
}

function pagerParams(filters: UserFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.q) params.q = filters.q
  if (filters.role) params.role = filters.role
  if (filters.banned !== 'all') params.banned = filters.banned
  return params
}

export default async function DashboardUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<SearchParams>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'Dashboard.users' })
  const sp = await searchParams
  const filters = parseFilters(sp)
  const page = parseInt(sp.page ?? '1', 10) || 1
  const data = await listUsers(filters, page)
  const session = await auth.api.getSession({ headers: await headers() })
  const currentUserId = session?.user.id ?? ''

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('title')}</h1>
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            {t('totalCount', { total: data.total.toLocaleString('en-US') })}
            {(filters.q || filters.role || filters.banned !== 'all') && (
              <Badge variant="secondary">{t('filterBadge')}</Badge>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <FilterSearch q={filters.q} placeholder={t('searchPlaceholder')} />
        <FilterSelect
          param="role"
          value={filters.role}
          placeholder={t('roleAll')}
          ariaLabel={t('role')}
          options={[
            { value: 'admin', label: t('roleAdmin') },
            { value: 'user', label: t('roleUser') },
          ]}
        />
        <FilterSelect
          param="banned"
          value={filters.banned}
          placeholder={t('statusAll')}
          ariaLabel={t('statusAria')}
          options={[
            { value: 'banned', label: t('statusBanned') },
            { value: 'active', label: t('statusActive') },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t('userHeader')}</TableHead>
              <TableHead>{t('phoneHeader')}</TableHead>
              <TableHead>{t('roleHeader')}</TableHead>
              <TableHead>{t('statusHeader')}</TableHead>
              <TableHead>{t('createdAtHeader')}</TableHead>
              <TableHead>{t('actionsHeader')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <UserPlus className="mx-auto mb-2 size-7" />
                  {t('empty')}
                </TableCell>
              </TableRow>
            ) : (
              data.rows.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {user.name || <span className="text-muted-foreground">—</span>}
                    </div>
                    <div className="text-xs text-muted-foreground" dir="ltr">
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground" dir="ltr">
                    {user.phoneNumber ?? <Badge variant="outline">—</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? t('roleAdmin') : t('roleUser')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.banned ? (
                      <Badge variant="destructive">{t('statusBanned')}</Badge>
                    ) : (
                      <Badge variant="secondary" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600">
                        {t('statusActive')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span dir="ltr">{formatDate(user.createdAt)}</span>
                  </TableCell>
                  <TableCell>
                    <UserManager
                      userId={user.id}
                      role={user.role}
                      banned={user.banned}
                      isSelf={user.id === currentUserId}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pager
        page={data.page}
        totalPages={data.pages}
        basePath="/dashboard/users/"
        params={pagerParams(filters)}
      />
    </div>
  )
}