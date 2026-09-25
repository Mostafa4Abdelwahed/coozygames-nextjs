import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MdVideogameAsset } from "react-icons/md";
import { categoryStyle } from "@/lib/category-meta";
import { getCategory, allCategorySlugs } from "@/lib/categories";
import { getGamesByCategory } from "@/lib/games";
import { applyOverrides, getPublicOverrides } from "@/lib/dashboard/overrides";
import { GameCard } from "@/components/game-card";
import { Pager, PAGE_SIZE } from "@/components/pager";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    allCategorySlugs().map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const category = getCategory(slug);
  const t = await getTranslations({ locale, namespace: "Game" });
  return { title: category ? `${category.labelAr} | Coozy Games` : "Coozy Games" };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "Game" });
  const common = await getTranslations({ locale, namespace: "Common" });
  const { page: pageParam } = await searchParams;
  const category = getCategory(slug);
  if (!category) notFound();

  const overrides = await getPublicOverrides();
  const games = applyOverrides(getGamesByCategory(category.slug), overrides);
  const totalPages = Math.max(1, Math.ceil(games.length / PAGE_SIZE));
  const page = Math.min(
    Math.max(1, parseInt(pageParam ?? "1", 10) || 1),
    totalPages,
  );
  const visible = games.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const Icon = categoryStyle(category.slug).icon;

  return (
    <div className="flex flex-col gap-6 p-3 sm:gap-8 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-night-80 text-brand-60">
          <Icon size={26} />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold text-white sm:text-2xl">
            {category.labelAr}
          </h1>
          <p className="text-sm font-semibold text-mist-50">
            {games.length} {common("games")}
          </p>
        </div>
      </div>

      {games.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {visible.map((game) => (
              <GameCard key={game.slug} game={game} />
            ))}
          </div>
          <Pager page={page} totalPages={totalPages} basePath={`/game-category/${category.slug}/`} />
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <MdVideogameAsset size={40} className="text-mist-50" />
          <p className="font-bold text-white">{t("noGamesYet")}</p>
          <p className="text-sm text-mist-50">{t("tryAnotherCategory")}</p>
        </div>
      )}
    </div>
  );
}