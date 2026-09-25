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

const ROLE_LABELS: Record<string, string> = { admin: 'أدمن', user: 'مستخدم' }

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
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">المستخدمون</h1>
          <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            {data.total.toLocaleString('en-US')} مستخدم
            {(filters.q || filters.role || filters.banned !== 'all') && (
              <Badge variant="secondary">مفلتر</Badge>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <FilterSearch q={filters.q} placeholder="بحث بالاسم أو الإيميل أو الهاتف" />
        <FilterSelect
          param="role"
          value={filters.role}
          placeholder="كل الأدوار"
          ariaLabel="الدور"
          options={[
            { value: 'admin', label: 'أدمن' },
            { value: 'user', label: 'مستخدم' },
          ]}
        />
        <FilterSelect
          param="banned"
          value={filters.banned}
          placeholder="كل الحالات"
          ariaLabel="الحالة"
          options={[
            { value: 'banned', label: 'محظور' },
            { value: 'active', label: 'نشط' },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>المستخدم</TableHead>
              <TableHead>الهاتف</TableHead>
              <TableHead>الدور</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ التسجيل</TableHead>
              <TableHead>إدارة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <UserPlus className="mx-auto mb-2 size-7" />
                  لا يوجد مستخدمون مطابقون
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
                      {ROLE_LABELS[(user.role ?? 'user')] ?? user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.banned ? (
                      <Badge variant="destructive">محظور</Badge>
                    ) : (
                      <Badge variant="secondary" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600">
                        نشط
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