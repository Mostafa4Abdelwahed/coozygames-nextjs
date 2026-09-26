"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { LayoutDashboard, Users, Gamepad2, BarChart3, Wrench, Settings, CreditCard, Link2, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type NavItem = { href: string; labelKey: string; icon: LucideIcon; exact?: boolean };
type NavGroup = { labelKey: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "sectionGeneral",
    items: [
      { href: "/dashboard", labelKey: "overview", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/analytics", labelKey: "analytics", icon: BarChart3 },
    ],
  },
  {
    labelKey: "sectionAdmin",
    items: [
      { href: "/dashboard/users", labelKey: "users", icon: Users },
      { href: "/dashboard/billing", labelKey: "billing", icon: CreditCard },
      { href: "/dashboard/access-links", labelKey: "accessLinks", icon: Link2 },
      { href: "/dashboard/games", labelKey: "games", icon: Gamepad2 },
      { href: "/dashboard/ops", labelKey: "ops", icon: Wrench },
      { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
    ],
  },
];

export function DashboardNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const tNav = useTranslations("Dashboard.nav");

  return (
    <nav aria-label={tNav("navAriaLabel")} className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.labelKey} className="flex flex-col gap-1">
          <div className="px-2 text-xs font-semibold text-muted-foreground">{tNav(group.labelKey)}</div>
          {group.items.map(({ href, labelKey, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "h-9 justify-start gap-2.5 px-3",
                  isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                  !isActive && "text-muted-foreground hover:text-sidebar-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{tNav(labelKey)}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}