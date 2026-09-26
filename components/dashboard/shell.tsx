"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { MdAdminPanelSettings } from "react-icons/md";
import { Home, LogOut, Menu, User, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth-client";
import { DashboardNav } from "./dashboard-nav";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useTranslations } from "next-intl";

type ShellUser = { name: string | null; role: string | null };

export function DashboardShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const tCommon = useTranslations("Dashboard.common");

  useLayoutEffect(() => {
    document.documentElement.classList.add("light");
    return () => document.documentElement.classList.remove("light");
  }, []);

  async function handleSignOut() {
    await signOut({ callbackURL: "/" });
    router.push("/");
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
              <span className="text-sm font-bold tracking-tight">{tCommon("menu")}</span>
              <Button variant="ghost" size="icon" aria-label={tCommon("menuClose")} onClick={() => setMobileOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <SidebarInner user={user} onNavigate={() => setMobileOpen(false)} onSignOut={handleSignOut} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            aria-label={tCommon("menuOpen")}
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <Link href="/dashboard/" className="truncate text-base font-bold tracking-tight">
            {tCommon("dashboard")}
          </Link>
          <div className="ms-auto flex items-center gap-2">
            <LocaleSwitcher />
            <UserMenu user={user} onSignOut={handleSignOut} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>

        <footer className="px-4 py-4 text-center text-xs font-medium text-muted-foreground">
          {tCommon("dashboard")} — Coozy Games
        </footer>
      </div>
    </div>
  );
}

function SidebarInner({
  user,
  onNavigate,
  onSignOut,
}: {
  user: ShellUser;
  onNavigate: () => void;
  onSignOut: () => void;
}) {
  const tCommon = useTranslations("Dashboard.common");
  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <MdAdminPanelSettings size={18} />
        </span>
        <span className="truncate font-bold tracking-tight">{tCommon("dashboard")}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <DashboardNav onNavigate={onNavigate} />
      </div>

      <div className="shrink-0 border-t p-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary/15 font-bold text-primary">
              {(user.name ?? tCommon("emptyInitial")).charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{user.name ?? tCommon("userFallback")}</div>
            <div className="text-xs font-medium text-muted-foreground">
              {user.role === "admin" ? tCommon("admin") : user.role}
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
            {tCommon("goToSite")}
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 px-3 text-destructive hover:text-destructive"
            onClick={() => void onSignOut()}
          >
            <LogOut className="size-4" />
            {tCommon("signOut")}
          </Button>
        </div>
      </div>
    </>
  );
}

function UserMenu({ user, onSignOut }: { user: ShellUser; onSignOut: () => void }) {
  const tCommon = useTranslations("Dashboard.common");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="rounded-full p-0.5 aria-expanded:bg-muted" />}
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/15 font-bold text-primary">
            {(user.name ?? tCommon("emptyInitial")).charAt(0)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <div className="flex items-center gap-3 rounded-md px-2.5 py-2">
            <Avatar className="size-10 shrink-0">
              <AvatarFallback className="bg-primary/15 font-bold text-primary">
                {(user.name ?? tCommon("emptyInitial")).charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{user.name ?? tCommon("userFallback")}</p>
              <p className="truncate text-xs font-medium text-muted-foreground">
                {user.role === "admin" ? tCommon("admin") : user.role}
              </p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/profile/" />} className="gap-2 py-1.5">
            <User />
            {tCommon("myAccount")}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/dashboard/" />} className="gap-2 py-1.5">
            <Home />
            {tCommon("backToSite")}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => void onSignOut()} className="gap-2 py-1.5">
            <LogOut />
            {tCommon("signOutLong")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}