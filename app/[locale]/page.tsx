import { GamesSection } from "@/components/games-section";
import { ACTION_GAMES, NEW_GAMES, PUZZLE_GAMES, TRENDING_GAMES } from "@/lib/games";
import { applyOverrides, getPublicOverrides } from "@/lib/dashboard/overrides";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

// First visible row of the page: load eagerly and mark the LCP candidate.
const FIRST_ROW = 6;

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "Home" });
  const overrides = await getPublicOverrides();

  return (
    <div className="flex flex-col gap-6 p-3 sm:gap-8 sm:p-5">
      <GamesSection title={t("trendingSection")} href="/games/?sort=hot" games={applyOverrides(TRENDING_GAMES, overrides)} priorityCount={FIRST_ROW} />
      <GamesSection title={t("newSection")} href="/games/?sort=new" games={applyOverrides(NEW_GAMES, overrides)} />
      <GamesSection title={t("actionSection")} href="/game-category/action/" games={applyOverrides(ACTION_GAMES, overrides)} />
      <GamesSection title={t("puzzleSection")} href="/game-category/puzzle/" games={applyOverrides(PUZZLE_GAMES, overrides)} />
    </div>
  );
}