'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Gamepad2, BarChart3, Wrench, Settings, CreditCard, Link2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean }
type NavGroup = { label: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'العامة',
    items: [
      { href: '/dashboard', label: 'نظرة عامة', icon: LayoutDashboard, exact: true },
      { href: '/dashboard/analytics', label: 'التحليلات', icon: BarChart3 },
    ],
  },
  {
    label: 'الإدارة',
    items: [
      { href: '/dashboard/users', label: 'المستخدمون', icon: Users },
      { href: '/dashboard/billing', label: 'الفواتير', icon: CreditCard },
      { href: '/dashboard/access-links', label: 'روابط الوصول', icon: Link2 },
      { href: '/dashboard/games', label: 'الألعاب', icon: Gamepad2 },
      { href: '/dashboard/ops', label: 'التشغيل', icon: Wrench },
      { href: '/dashboard/settings', label: 'الإعدادات', icon: Settings },
    ],
  },
]

export function DashboardNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav aria-label="أقسام لوحة التحكم" className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <div className="px-2 text-xs font-semibold text-muted-foreground">{group.label}</div>
          {group.items.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'h-9 justify-start gap-2.5 px-3',
                  isActive && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
                  !isActive && 'text-muted-foreground hover:text-sidebar-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}