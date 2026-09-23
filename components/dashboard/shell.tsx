'use client'

import { useLayoutEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MdAdminPanelSettings } from 'react-icons/md'
import { Home, LogOut, Menu, X } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/lib/auth-client'
import { DashboardNav } from './dashboard-nav'

type ShellUser = { name: string | null; role: string | null }

export function DashboardShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useLayoutEffect(() => {
    document.documentElement.classList.add('light')
    return () => document.documentElement.classList.remove('light')
  }, [])

  async function handleSignOut() {
    await signOut({ callbackURL: '/' })
    router.push('/')
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e bg-sidebar lg:flex">
        <SidebarInner user={user} onNavigate={() => setMobileOpen(false)} onSignOut={handleSignOut} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 start-0 flex w-72 max-w-[85%] flex-col border-e bg-sidebar shadow-2xl">
            <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
              <span className="text-sm font-bold tracking-tight">القائمة</span>
              <Button variant="ghost" size="icon" aria-label="إغلاق القائمة" onClick={() => setMobileOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <SidebarInner
              user={user}
              onNavigate={() => setMobileOpen(false)}
              onSignOut={handleSignOut}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            aria-label="فتح القائمة"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <Link href="/dashboard/" className="truncate text-base font-bold tracking-tight">
            لوحة التحكم
          </Link>
          <span className="ms-auto">
            <UserMenu user={user} onSignOut={handleSignOut} />
          </span>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>

        <footer className="px-4 py-4 text-center text-xs font-medium text-muted-foreground">
          Coozy Games — لوحة التحكم
        </footer>
      </div>
    </div>
  )
}

function SidebarInner({
  user,
  onNavigate,
  onSignOut,
}: {
  user: ShellUser
  onNavigate: () => void
  onSignOut: () => void
}) {
  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <MdAdminPanelSettings size={18} />
        </span>
        <span className="truncate font-bold tracking-tight">لوحة التحكم</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <DashboardNav onNavigate={onNavigate} />
      </div>

      <div className="shrink-0 border-t p-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary/15 font-bold text-primary">
              {(user.name ?? '؟').charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{user.name ?? 'أدمن'}</div>
            <div className="text-xs font-medium text-muted-foreground">
              {user.role === 'admin' ? 'أدمن' : user.role}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1">
          <Link
            href="/"
            onClick={onNavigate}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-input px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Home className="size-4" />
            الموقع
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 px-3 text-destructive hover:text-destructive"
            onClick={() => void onSignOut()}
          >
            <LogOut className="size-4" />
            خروج
          </Button>
        </div>
      </div>
    </>
  )
}

function UserMenu({ user, onSignOut }: { user: ShellUser; onSignOut: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="rounded-full p-0.5 aria-expanded:bg-muted" />}
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/15 font-bold text-primary">
            {(user.name ?? '؟').charAt(0)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-bold text-foreground">{user.name ?? 'أدمن'}</span>
          <span className="text-xs font-medium">{user.role === 'admin' ? 'أدمن' : user.role}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/" />}>
          <Home />
          العودة للموقع
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => void onSignOut()}>
          <LogOut />
          تسجيل الخروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}