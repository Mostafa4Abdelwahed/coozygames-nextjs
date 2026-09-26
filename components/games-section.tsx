"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Game } from "@/lib/games";
import { GameCard } from "./game-card";

type GameSectionGame = Omit<Game, "icon">;

export function GamesSection({
  title,
  href,
  games,
  priorityCount = 0,
}: {
  title: string;
  href: string;
  games: GameSectionGame[];
  /** When > 0, the first card is treated as the page LCP candidate. */
  priorityCount?: number;
}) {
  const t = useTranslations("Common");

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-white sm:text-xl">{title}</h2>
        <Link href={href} className="text-sm font-bold text-brand-60 transition hover:text-white">
          {t("viewAll")}
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7">
        {games.map((game, i) => (
          <GameCard key={game.slug} game={game} priority={priorityCount > 0 && i === 0} />
        ))}
      </div>
    </section>
  );
}