'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Gamepad2, BarChart3, Wrench, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'نظرة عامة', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/users', label: 'المستخدمون', icon: Users },
  { href: '/dashboard/games', label: 'الألعاب', icon: Gamepad2 },
  { href: '/dashboard/analytics', label: 'التحليلات', icon: BarChart3 },
  { href: '/dashboard/ops', label: 'التشغيل', icon: Wrench },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="أقسام لوحة التحكم" className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'h-8 shrink-0 gap-2 text-muted-foreground',
        )}
      >
        <Home size={15} />
        <span className="hidden sm:inline">الموقع</span>
      </Link>

      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              buttonVariants({ variant: isActive ? 'secondary' : 'ghost', size: 'sm' }),
              'h-8 shrink-0 gap-2',
              !isActive && 'text-muted-foreground',
            )}
          >
            <Icon size={15} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}