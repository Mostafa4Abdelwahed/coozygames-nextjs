import { headers } from 'next/headers'
import { MdSearch, MdPersonAddAlt } from 'react-icons/md'
import { Pager } from '@/components/pager'
import { listUsers, type UserFilters } from '@/lib/dashboard/queries'
import { auth } from '@/lib/auth'
import { UserManager } from '@/components/dashboard/user-manager'

const ROLE_LABELS: Record<string, string> = { admin: 'أدمن', user: 'مستخدم' }

const INPUT_STYLE =
  'h-10 rounded-xl border border-night-60 bg-night-80 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-mist-30 focus:border-brand-60'
const SELECT_STYLE =
  'h-10 rounded-xl border border-night-60 bg-night-80 px-2 text-sm font-semibold text-mist-50 outline-none transition focus:border-brand-60'

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
      <div>
        <h1 className="text-xl font-extrabold text-white sm:text-2xl">المستخدمون</h1>
        <p className="mt-1 text-sm font-semibold text-mist-50">
          {data.total.toLocaleString('en-US')} مستخدم
        </p>
      </div>

      <form
        action="/dashboard/users/"
        method="get"
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap"
      >
        <div className="relative min-w-0 flex-1">
          <MdSearch
            size={18}
            className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-mist-50"
          />
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="بحث بالاسم أو الإيميل أو الهاتف"
            className={`${INPUT_STYLE} w-full ps-10`}
          />
        </div>
        <select name="role" defaultValue={filters.role} aria-label="الدور" className={SELECT_STYLE}>
          <option value="">كل الأدوار</option>
          <option value="admin">أدمن</option>
          <option value="user">مستخدم</option>
        </select>
        <select name="banned" defaultValue={filters.banned} aria-label="الحالة" className={SELECT_STYLE}>
          <option value="all">كل الحالات</option>
          <option value="banned">محظور</option>
          <option value="active">نشط</option>
        </select>
        <button
          type="submit"
          className="h-10 rounded-xl bg-brand-100 px-5 text-sm font-extrabold text-white transition hover:bg-brand-80"
        >
          عرض
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-night-60">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="bg-night-80 text-start text-xs font-extrabold text-mist-50">
              <th className="px-4 py-3 text-start">المستخدم</th>
              <th className="px-4 py-3 text-start">الهاتف</th>
              <th className="px-4 py-3 text-start">الدور</th>
              <th className="px-4 py-3 text-start">الحالة</th>
              <th className="px-4 py-3 text-start">تاريخ التسجيل</th>
              <th className="px-4 py-3 text-start">إدارة</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-mist-50">
                  <MdPersonAddAlt size={28} className="mx-auto mb-2" />
                  لا يوجد مستخدمون مطابقون
                </td>
              </tr>
            ) : (
              data.rows.map((user) => (
                <tr key={user.id} className="border-t border-night-60 bg-night-100">
                  <td className="px-4 py-3">
                    <div className="font-bold text-white">{user.name || <span className="text-mist-50">—</span>}</div>
                    <div className="text-xs text-mist-50" dir="ltr">
                      {user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-mist-50" dir="ltr">
                    {user.phoneNumber ?? <span className="text-mist-30">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                        user.role === 'admin' ? 'bg-brand-100 text-white' : 'bg-night-60 text-mist-50'
                      }`}
                    >
                      {ROLE_LABELS[(user.role ?? 'user')] ?? user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.banned ? (
                      <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-extrabold text-red-400">
                        محظور
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-extrabold text-emerald-400">
                        نشط
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-mist-50">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <UserManager
                      userId={user.id}
                      role={user.role}
                      banned={user.banned}
                      isSelf={user.id === currentUserId}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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