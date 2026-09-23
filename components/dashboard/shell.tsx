import type { ReactNode } from 'react'
import Link from 'next/link'
import { MdAdminPanelSettings } from 'react-icons/md'
import { DashboardNav } from './dashboard-nav'

export function DashboardShell({
  user,
  children,
}: {
  user: { name: string | null; role: string | null }
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-night-100">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-night-60 bg-night-80 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-white">
            <MdAdminPanelSettings size={18} />
          </span>
          <Link href="/dashboard/" className="truncate text-lg font-extrabold text-white">
            لوحة التحكم
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm font-bold text-mist-50">
          <span className="hidden truncate sm:inline">{user.name}</span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6842ff,#22d3ee)] text-xs font-extrabold text-white">
            {(user.name ?? '؟').charAt(0)}
          </span>
        </div>
      </header>

      <div className="sticky top-14 z-20 flex items-center gap-2 bg-night-100 px-4 py-2 sm:px-6">
        <DashboardNav />
      </div>

      <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6">{children}</main>

      <footer className="px-4 py-4 text-center text-xs font-semibold text-mist-50">
        Coozy Games — لوحة التحكم
      </footer>
    </div>
  )
}