export interface SjFrame {
  go: (url: string) => void
}

declare global {
  interface Window {
    scramjet: {
      createFrame: (el: HTMLIFrameElement) => SjFrame
    }
    scramjetReady: Promise<void>
    registerSW: (wispUrl?: string) => Promise<void>
    __WISP_URL__?: string
  }
}

// Lazy, ordered loading of the proxy runtime. Scripts load only when a game
// is actually opened so they never block initial render. Idempotent.
const PROXY_SCRIPTS = ['/scram/scramjet.all.js', '/scramjet-init.js', '/baremux/index.js', '/register-sw.js']

let proxyLoadPromise: Promise<void> | null = null

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      resolve()
      return
    }
    const el = document.createElement('script')
    el.src = src
    el.async = false
    el.onload = () => resolve()
    el.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(el)
  })
}

export function ensureProxy(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('client only'))
  if (!proxyLoadPromise) {
    proxyLoadPromise = (async () => {
      for (const src of PROXY_SCRIPTS) {
        await loadScript(src)
      }
      await window.registerSW(normalizeWispUrl(process.env.NEXT_PUBLIC_WISP_URL))
      // Wait until the worker is actually active; otherwise the game frame
      // navigates before interception starts and Next answers 404.
      await navigator.serviceWorker.ready
      await window.scramjetReady
    })().catch((err) => {
      proxyLoadPromise = null
      throw err
    })
  }
  return proxyLoadPromise
}

/** Creates the Scramjet frame bound to an iframe (call once per iframe). */
export function createGameFrame(iframe: HTMLIFrameElement): SjFrame {
  return window.scramjet.createFrame(iframe)
}

/**
 * Browsers refuse WebSocket connections to 0.0.0.0; rewrite it to the page's
 * own host so a misconfigured NEXT_PUBLIC_WISP_URL can never break the game.
 */
function normalizeWispUrl(url?: string): string | undefined {
  if (!url || typeof window === 'undefined') return url
  return url.replace(/^ws:\/\/(?:0\.0\.0\.0|\[::\])/, `ws://${window.location.hostname}`)
}
