/**
 * Client-safe thumbnail URL helpers (no data imports).
 * Paths under /image are content-hashed, so transform params are safe to cache
 * immutably. Widths are intentionally a small fixed set to bound the variant cache.
 */

export const CARD_THUMB_WIDTH = 470
export const POSTER_THUMB_WIDTH = 800
export const MINI_THUMB_WIDTH = 80
export const HEADER_THUMB_WIDTH = 160

/**
 * `sizes` for the game-card grid (2/3/4/6/7 columns across breakpoints). Without
 * it the browser assumes 100vw and picks the largest srcset candidate (~1920px).
 * Tuned to the densest layout so no card is ever under-sized.
 */
export const CARD_IMAGE_SIZES =
  '(min-width: 1536px) 13vw, (min-width: 1280px) 16vw, (min-width: 1024px) 24vw, (min-width: 640px) 33vw, 49vw'

export function thumbUrl(
  thumb: string | undefined,
  width: number,
  format: 'webp' | 'avif' = 'webp',
  quality = 75,
): string | undefined {
  if (!thumb) return undefined
  const sep = thumb.includes('?') ? '&' : '?'
  return `${thumb}${sep}w=${width}&f=${format}&q=${quality}`
}
