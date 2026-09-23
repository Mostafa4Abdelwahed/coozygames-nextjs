/**
 * Runtime Wisp endpoint config.
 * Served as a classic script so the static proxy assets (register-sw.js) can
 * read it. Read from env at request time -> changing WISP_URL needs no rebuild.
 *
 *   WISP_URL=wss://coozygames.com/wisp/     (production, same-origin via reverse proxy)
 *   WISP_URL=                               (empty -> register-sw.js falls back to host:8081)
 */
export const dynamic = 'force-dynamic'

function normalize(raw: string): string {
  const value = raw.trim()
  if (!value) return ''
  return value.endsWith('/') ? value : `${value}/`
}

export function GET() {
  const wispUrl = normalize(process.env.WISP_URL ?? '')
  const body = `window.__WISP_URL__=${JSON.stringify(wispUrl)};`
  return new Response(body, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
