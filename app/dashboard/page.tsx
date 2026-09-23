import { MdGroup, MdSchedule, MdVideogameAsset, MdCategory } from 'react-icons/md'
import { getDashboardCounts } from '@/lib/dashboard/queries'

const CARD_STYLE = 'flex flex-col gap-1 rounded-2xl bg-night-80 p-4 sm:p-5'

export default async function DashboardOverviewPage() {
  const counts = await getDashboardCounts()

  const cards = [
    { label: 'المستخدمون', value: counts.users.toLocaleString('en-US'), icon: MdGroup },
    { label: 'الجلسات النشطة', value: counts.activeSessions.toLocaleString('en-US'), icon: MdSchedule },
    { label: 'الألعاب', value: counts.games.toLocaleString('en-US'), icon: MdVideogameAsset },
    { label: 'التصنيفات', value: counts.categories.toLocaleString('en-US'), icon: MdCategory },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-white sm:text-2xl">نظرة عامة</h1>
        <p className="mt-1 text-sm font-semibold text-mist-50">أرقام سريعة عن الموقع</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className={CARD_STYLE}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-night-60 text-brand-60">
              <Icon size={20} />
            </span>
            <span className="text-2xl font-extrabold text-white">{value}</span>
            <span className="text-sm font-bold text-mist-50">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}