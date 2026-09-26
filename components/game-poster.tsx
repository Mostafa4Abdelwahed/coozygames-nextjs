import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { MdPlayArrow } from "react-icons/md";
import { POSTER_THUMB_WIDTH, thumbUrl } from "@/lib/image";
import Image from "next/image";

/**
 * Game detail poster: clicking it navigates to the dedicated full-page player
 * at /play/[slug]. No proxy code is loaded here.
 * Server component: the poster uses `fill` so the browser picks a srcset
 * candidate instead of always downloading the full 800px variant.
 */
export async function GamePoster({ slug, title, thumb }: { slug: string; title: string; thumb?: string }) {
  const t = await getTranslations("Game");
  const poster = thumbUrl(thumb, POSTER_THUMB_WIDTH);

  return (
    <Link
      href={`/play/${slug}/`}
      aria-label={t("playNowAria", { title })}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-night-60 bg-black"
    >
      {poster && (
        <Image
          src={poster}
          alt=""
          aria-hidden="true"
          fill
          sizes="(min-width: 1152px) 1152px, 100vw"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="object-cover opacity-40 transition-opacity duration-300 group-hover:opacity-50"
        />
      )}
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-white shadow-2xl transition-transform duration-200 group-hover:scale-105 group-hover:bg-brand-80">
          <MdPlayArrow size={44} />
        </span>
        <span className="text-lg font-extrabold text-white">{t("playNow")}</span>
      </span>
    </Link>
  );
}
