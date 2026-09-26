import Link from "next/link";
import type { Metadata } from "next";
import { ALL_GAMES, NEW_ALL, TRENDING_ALL } from "@/lib/games";
import { applyOverrides, getPublicOverrides } from "@/lib/dashboard/overrides";
import { GameCard } from "@/components/game-card";
import { Pager, PAGE_SIZE } from "@/components/pager";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

const SORTS = [
  { key: "hot", labelKey: "sortHot" },
  { key: "new", labelKey: "sortNew" },
  { key: "updated", labelKey: "sortUpdated" },
] as const;

type SortKey = (typeof SORTS)[number]["key"];

function isSortKey(value: string | undefined): value is SortKey {
  return SORTS.some((s) => s.key === value);
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Games" });
  return { title: t("pageTitle") };
}

export default async function GamesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "Games" });
  const { sort, page: pageParam } = await searchParams;
  const activeSort: SortKey = isSortKey(sort) ? sort : "hot";

  const overrides = await getPublicOverrides();
  const games = applyOverrides(
    activeSort === "new" ? NEW_ALL : activeSort === "updated" ? ALL_GAMES : TRENDING_ALL,
    overrides,
  );
  const activeLabel = t(SORTS.find((s) => s.key === activeSort)?.labelKey ?? "sortHot");

  const totalPages = Math.max(1, Math.ceil(games.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, parseInt(pageParam ?? "1", 10) || 1), totalPages);
  const visible = games.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const tabParams: Record<string, string> = activeSort === "hot" ? {} : { sort: activeSort };

  return (
    <div className="flex flex-col gap-6 p-3 sm:gap-8 sm:p-5">
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-extrabold text-white sm:text-2xl">
          {activeLabel} <span className="text-sm font-bold text-mist-50">({games.length})</span>
        </h1>
        <div className="flex gap-2">
          {SORTS.map((tab) => (
            <Link
              key={tab.key}
              href={tab.key === "hot" ? "/games/" : `/games/?sort=${tab.key}`}
              aria-current={tab.key === activeSort ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                tab.key === activeSort
                  ? "bg-brand-100 text-white"
                  : "bg-night-80 text-mist-50 hover:text-white"
              }`}
            >
              {t(tab.labelKey)}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {visible.map((game) => (
          <GameCard key={game.slug} game={game} />
        ))}
      </div>

      <Pager page={page} totalPages={totalPages} basePath="/games/" params={tabParams} />
    </div>
  );
}