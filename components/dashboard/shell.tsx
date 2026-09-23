'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MdAdminPanelSettings } from 'react-icons/md'
import { Home, LogOut } from 'lucide-react'
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

export function DashboardShell({
  user,
  children,
}: {
  user: { name: string | null; role: string | null }
  children: ReactNode
}) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut({ callbackURL: '/' })
    router.push('/')
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MdAdminPanelSettings size={18} />
          </span>
          <Link href="/dashboard/" className="truncate text-lg font-bold tracking-tight text-foreground">
            لوحة التحكم
          </Link>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="rounded-full p-0.5 aria-expanded:bg-muted" />
            }
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
            <DropdownMenuItem variant="destructive" onClick={() => void handleSignOut()}>
              <LogOut />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="sticky top-14 z-20 border-b bg-background px-4 py-2 sm:px-6">
        <DashboardNav />
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>

      <footer className="px-4 py-4 text-center text-xs font-medium text-muted-foreground">
        Coozy Games — لوحة التحكم
      </footer>
    </div>
  )
}