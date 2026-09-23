export interface SjFrame {
  go: (url: string) => void
}

declare global {
  interface Window {
    /** Injected by /api/wisp-config from the WISP_URL env var. */
    __WISP_URL__?: string
    scramjet: {
      createFrame: (el: HTMLIFrameElement) => SjFrame
    }
    scramjetReady: Promise<void>
    registerSW: () => Promise<void>
  }
}

// Lazy, ordered loading of the proxy runtime. Scripts load only when a game
// is actually opened so they never block initial render. Idempotent.
// `/api/wisp-config` must load first so register-sw.js can read __WISP_URL__.
const PROXY_SCRIPTS = [
  '/api/wisp-config',
  '/scram/scramjet.all.js',
  '/scramjet-init.js',
  '/baremux/index.js',
  '/register-sw.js',
]

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
        // eslint-disable-next-line no-await-in-loop
        await loadScript(src)
      }
      await window.registerSW()
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

export function openGameFrame(iframe: HTMLIFrameElement, url: string): SjFrame {
  const frame = window.scramjet.createFrame(iframe)
  frame.go(url)
  return frame
}
