import Link from 'next/link'
import { MdPlayArrow } from 'react-icons/md'
import { POSTER_THUMB_WIDTH, thumbUrl } from '@/lib/image'

/**
 * Game detail poster: clicking it navigates to the dedicated full-page player
 * at /play/[slug]. No proxy code is loaded here.
 */
export function GamePoster({ slug, title, thumb }: { slug: string; title: string; thumb?: string }) {
  const poster = thumbUrl(thumb, POSTER_THUMB_WIDTH)

  return (
    <Link
      href={`/play/${slug}/`}
      aria-label={`العب ${title} الآن`}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-night-60 bg-black"
    >
      {poster && (
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          width={628}
          height={628}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-40 transition-opacity duration-300 group-hover:opacity-50"
        />
      )}
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-white shadow-2xl transition-transform duration-200 group-hover:scale-105 group-hover:bg-brand-80">
          <MdPlayArrow size={44} />
        </span>
        <span className="text-lg font-extrabold text-white">العب الآن</span>
      </span>
    </Link>
  )
}
