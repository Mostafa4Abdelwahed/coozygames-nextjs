import Link from 'next/link'
import {
  MdBarChart,
  MdGroups,
  MdGames,
  MdSchedule,
  MdTrendingUp,
  MdCategory,
} from 'react-icons/md'
import { getAnalytics } from '@/lib/dashboard/queries'

const CARD_STYLE = 'flex flex-col gap-1 rounded-2xl bg-night-80 p-4 sm:p-5'

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

function formatDay(day: string): string {
  const date = new Date(`${day}T00:00:00Z`)
  const label = DAYS[date.getUTCDay()] ?? ''
  return `${label} ${date.getUTCDate()}/${date.getUTCMonth() + 1}`
}

function BarRow({ label, sub, count, max }: { label: string; sub?: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate font-bold text-white" title={label}>
          {label}
        </span>
        <span className="shrink-0 text-xs font-extrabold text-mist-50">
          {count.toLocaleString('en-US')}
          {sub ? <span className="text-mist-30"> {sub}</span> : null}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-night-60">
        <div className="h-full rounded-full bg-brand-100" style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </div>
  )
}

export default async function AnalyticsPage() {
  const data = await getAnalytics()
  const { overview } = data

  const cards = [
    { label: 'إجمالي اللعب', value: overview.total, icon: MdGames },
    { label: 'آخر 24 ساعة', value: overview.last24h, icon: MdSchedule },
    { label: 'آخر 7 أيام', value: overview.last7d, icon: MdTrendingUp },
    { label: 'آخر 30 يومًا', value: overview.last30d, icon: MdSchedule },
  ]

  const maxTop = Math.max(...data.topGames.map((g) => g.plays), 1)
  const maxCat = Math.max(...data.topCategories.map((c) => c.plays), 1)
  const maxHour = Math.max(...data.hourly.map((h) => h.count), 1)
  const maxDau = Math.max(...data.dau.map((d) => d.plays), 1)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-white sm:text-2xl">التحليلات</h1>
        <p className="mt-1 text-sm font-semibold text-mist-50">أرقام لعب فعلية من play_events</p>
      </div>

      {overview.total === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-night-60 bg-night-80 py-16 text-center">
          <MdBarChart size={40} className="text-mist-50" />
          <p className="font-bold text-white">لا توجد بيانات لعب بعد</p>
          <p className="text-sm text-mist-50">ستظهر الأرقام هنا بمجرد بدء تشغيل أي لعبة</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cards.map(({ label, value, icon: Icon }) => (
              <div key={label} className={CARD_STYLE}>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-night-60 text-brand-60">
                  <Icon size={20} />
                </span>
                <span className="text-2xl font-extrabold text-white">{value.toLocaleString('en-US')}</span>
                <span className="text-sm font-bold text-mist-50">{label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <section className="flex flex-col gap-3 rounded-2xl border border-night-60 bg-night-80 p-4">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
                <MdTrendingUp size={20} className="text-brand-60" />
                أشهر الألعاب (آخر 7 أيام)
              </h2>
              <div className="flex flex-col gap-3">
                {data.topGames.length === 0 ? (
                  <p className="text-sm text-mist-50">لا لعب خلال آخر 7 أيام</p>
                ) : (
                  data.topGames.map((g) => (
                    <BarRow key={g.slug} label={g.title} count={g.plays} max={maxTop} />
                  ))
                )}
              </div>
            </section>

            <section className="flex flex-col gap-3 rounded-2xl border border-night-60 bg-night-80 p-4">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
                <MdCategory size={20} className="text-brand-60" />
                أشهر التصنيفات (آخر 7 أيام)
              </h2>
              <div className="flex flex-col gap-3">
                {data.topCategories.length === 0 ? (
                  <p className="text-sm text-mist-50">لا لعب خلال آخر 7 أيام</p>
                ) : (
                  data.topCategories.map((c) => (
                    <BarRow key={c.slug} label={c.labelAr} count={c.plays} max={maxCat} />
                  ))
                )}
              </div>
            </section>

            <section className="flex flex-col gap-3 rounded-2xl border border-night-60 bg-night-80 p-4">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
                <MdGroups size={20} className="text-brand-60" />
                النشاط اليومي (آخر 14 يومًا)
              </h2>
              <div className="flex flex-col gap-3">
                {data.dau.length === 0 ? (
                  <p className="text-sm text-mist-50">لا بيانات بعد</p>
                ) : (
                  data.dau.map((d) => (
                    <BarRow
                      key={d.day}
                      label={formatDay(d.day)}
                      sub={`${d.users} مستخدم`}
                      count={d.plays}
                      max={maxDau}
                    />
                  ))
                )}
              </div>
            </section>

            <section className="flex flex-col gap-3 rounded-2xl border border-night-60 bg-night-80 p-4">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
                <MdSchedule size={20} className="text-brand-60" />
                توزيع الساعات (آخر 7 أيام)
              </h2>
              <div className="flex flex-col gap-3">
                {data.hourly.length === 0 ? (
                  <p className="text-sm text-mist-50">لا بيانات بعد</p>
                ) : (
                  data.hourly.map((h) => (
                    <BarRow
                      key={h.hour}
                      label={`${String(h.hour).padStart(2, '0')}:00`}
                      count={h.count}
                      max={maxHour}
                    />
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs font-bold text-mist-50">اللعبة:</span>
            {data.topGames.slice(0, 6).map((g) => (
              <Link
                key={g.slug}
                href={`/game/${g.slug}/`}
                className="rounded-full bg-night-80 px-2.5 py-0.5 text-xs font-bold text-brand-60 transition hover:bg-brand-100 hover:text-white"
              >
                {g.title}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}