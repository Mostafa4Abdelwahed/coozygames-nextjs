'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MdDashboard, MdPeople, MdVideogameAsset, MdHome, MdBarChart, MdBuild } from 'react-icons/md'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'نظرة عامة', icon: MdDashboard, exact: true },
  { href: '/dashboard/users', label: 'المستخدمون', icon: MdPeople },
  { href: '/dashboard/games', label: 'الألعاب', icon: MdVideogameAsset },
  { href: '/dashboard/analytics', label: 'التحليلات', icon: MdBarChart },
  { href: '/dashboard/ops', label: 'التشغيل', icon: MdBuild },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="أقسام لوحة التحكم" className="flex items-center gap-1 overflow-x-auto no-scrollbar">
      <Link
        href="/"
        className="flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-bold text-mist-50 transition hover:bg-night-80 hover:text-white"
      >
        <MdHome size={18} />
        <span className="hidden sm:inline">العودة للموقع</span>
      </Link>

      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-bold transition ${
              isActive ? 'bg-brand-100 text-white' : 'text-mist-50 hover:bg-night-80 hover:text-white'
            }`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}