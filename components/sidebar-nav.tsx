"use client";

import { memo, useContext } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  SIDEBAR_TOP_KEYS,
  getSidebarTopLabel,
  type SidebarTopKey,
  categoryStyle,
  getChevronIcon,
  type NavCategory,
} from "@/lib/category-meta";
import { SidebarItem } from "./sidebar-item";
import { useTranslations } from "next-intl";

function normalize(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/** Strip the leading locale prefix (e.g. /ar/games -> /games). */
function stripLocale(path: string): string {
  return path.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
}

function itemKey(href: string): string {
  const clean = normalize(href);
  if (clean === "/") return "/";
  if (clean === "/games") {
    const query = href.split("?")[1] ?? "";
    return `games:${new URLSearchParams(query).get("sort") ?? "hot"}`;
  }
  return clean;
}

function SidebarNavList({
  forceLabels,
  activeKey,
  categories,
  locale,
}: {
  forceLabels: boolean;
  activeKey: string;
  categories: NavCategory[];
  locale: string;
}) {
  const t = useTranslations("Nav");
  const Chevron = getChevronIcon(locale);

  return (
    <>
      {SIDEBAR_TOP_KEYS.map((item) => (
        <SidebarItem
          key={item.key}
          label={getSidebarTopLabel(item.key as SidebarTopKey, locale)}
          href={item.href}
          icon={item.icon}
          active={!item.disabled && itemKey(item.href) === activeKey}
          forceLabels={forceLabels}
          chevronIcon={Chevron}
        />
      ))}

      <div role="separator" className="mx-4 my-2 border-t border-night-60" />

      {categories.map((cat) => {
        const href = `/game-category/${cat.slug}/`;
        const label = locale === "ar" ? cat.labelAr : cat.labelEn;
        return (
          <SidebarItem
            key={cat.slug}
            label={label}
            href={href}
            icon={categoryStyle(cat.slug).icon}
            active={normalize(href) === activeKey}
            forceLabels={forceLabels}
            chevronIcon={Chevron}
          />
        );
      })}
    </>
  );
}

export const SidebarNav = memo(function SidebarNav({
  forceLabels,
  categories,
}: {
  forceLabels: boolean;
  categories: NavCategory[];
}) {
  const rawPathname = usePathname();
  const sort = useSearchParams().get("sort") ?? "hot";
  const pathname = normalize(stripLocale(rawPathname));
  const activeKey = pathname === "/games" ? `games:${sort}` : pathname;
  const locale = rawPathname.split("/")[1] === "en" ? "en" : "ar";

  return <SidebarNavList forceLabels={forceLabels} activeKey={activeKey} categories={categories} locale={locale} />;
});

export const SidebarNavStatic = memo(function SidebarNavStatic({
  forceLabels,
  categories,
}: {
  forceLabels: boolean;
  categories: NavCategory[];
}) {
  return <SidebarNavList forceLabels={forceLabels} activeKey="/" categories={categories} locale="ar" />;
});