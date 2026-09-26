import Link from "next/link";
import type { Game } from "@/lib/games";
import { categoryLabelAr } from "@/lib/category-meta";
import { CARD_IMAGE_SIZES, CARD_THUMB_WIDTH, thumbUrl } from "@/lib/image";
import Image from "next/image";

export function GameCard({
  game,
  priority = false,
}: {
  game: Game;
  /** Mark as the LCP candidate: eager + fetchpriority=high. Use for one card only. */
  priority?: boolean;
}) {
  const Icon = game.icon;
  const src = thumbUrl(game.thumb, CARD_THUMB_WIDTH);

  return (
    <Link
      href={`/game/${game.slug}/`}
      className="group overflow-hidden rounded-xl bg-night-80 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className={`relative aspect-square overflow-hidden bg-linear-to-br ${game.gradient}`}>
        {src ? (
          <Image
            src={src}
            alt={game.title}
            width={628}
            height={628}
            sizes={CARD_IMAGE_SIZES}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <Icon size={64} className="text-white/85 drop-shadow transition-transform duration-200 group-hover:scale-110" />
          </span>
        )}
        <span className="absolute inset-e-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-xs font-bold text-white">
          ★ {game.rating}
        </span>
      </div>
      <div className="p-2.5">
        <h3 className="truncate text-sm font-bold text-white">{game.title}</h3>
        <p className="mt-0.5 truncate text-xs font-semibold text-mist-50">
          {categoryLabelAr(game.categorySlug, game.category)} • {game.plays}
        </p>
      </div>
    </Link>
  );
}