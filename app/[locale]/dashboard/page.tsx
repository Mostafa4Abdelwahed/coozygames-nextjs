import { Users, Activity, Gamepad2, Tags, Play, Timer } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { getDashboardCounts } from '@/lib/dashboard/queries'

export default async function DashboardOverviewPage() {
  const counts = await getDashboardCounts()

  const cards = [
    { label: 'المستخدمون', value: counts.users.toLocaleString('en-US'), icon: Users },
    { label: 'الجلسات النشطة', value: counts.activeSessions.toLocaleString('en-US'), icon: Activity },
    { label: 'لعب آخر 24 ساعة', value: counts.plays24h.toLocaleString('en-US'), icon: Play },
    { label: 'إجمالي اللعب', value: counts.playsTotal.toLocaleString('en-US'), icon: Timer },
    { label: 'الألعاب', value: counts.games.toLocaleString('en-US'), icon: Gamepad2 },
    { label: 'التصنيفات', value: counts.categories.toLocaleString('en-US'), icon: Tags },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">نظرة عامة</h1>
        <p className="text-sm font-medium text-muted-foreground">أرقام سريعة عن الموقع</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="px-4 pt-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-0.5 px-4 pb-4">
              <span className="text-2xl font-bold tracking-tight">{value}</span>
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}