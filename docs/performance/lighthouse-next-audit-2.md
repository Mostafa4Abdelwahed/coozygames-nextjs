# Lighthouse Audit #2 — CoozyGames (post P0-1)

- **Date:** 2026-09-22
- **Scope:** Investigation only. No source changes, no package changes, no commits.
- **Inputs:** Lighthouse (Perf 64, FCP 1.3s, LCP 4.2s, TBT 980ms, SI 2.2s, main-thread 5.6s, Script Eval 2,425ms, Style & Layout 1,040ms, forced reflow 170ms, DOM 836/9/76) + first-party measurements below.
- **Method:** static inspection of `data/games.json`, `image-cache/`, built chunks in `.next/`, rendered `index.html`; plus headless-Chrome runtime probes (network, resource timing, LCP, long tasks) against `npm start`. P0-1 (catalog out of client bundle) is assumed done.

## Current bottlenecks

Ranked by measured/estimated impact:

1. **Image pipeline** — source thumbnails up to **6144×6144 / 7.33 MB** are served unmodified and displayed at **~235×235**. Home page references **16.32 MB** of card images on disk. LCP element is an `<img>`. This is the dominant bottleneck (Lighthouse ~8.26 MB savings).
2. **LCP prioritization** — the LCP image is the first game card, marked `loading="lazy"`, with no `fetchpriority` and no preload. Measured LCP paint at **3.64 s** while the image itself finished at ~1.26 s → paint is gated by main-thread congestion, and lazy/low priority delays the request start (~908 ms).
3. **Main-thread / hydration work** — 5 long tasks measured, largest **465 ms @1.68 s**, plus 292 ms @0.85 s and 175 ms @0.65 s (~1.13 s total blocking). Attributed by Lighthouse to `1zi5eas0-g_6u.js` (1,341 ms) and `27t_qfc-3_lzs.js` (951 ms) — both Next.js runtime — driven by our component tree size.
4. **DOM/layout** — 850–865 elements, of which the **sidebar is 529 (62%)**; no virtualization/`content-visibility`; 75 `transition-all` items + 36 animated cards + Arabic text shaping → Style & Layout 1,040 ms.

Non-bottlenecks (verified, no action): RSC prefetch storm (0 prefetch requests measured), react-icons chunk (15.2 KB), games catalog (already removed in P0-1).

## Image findings

### Exact files
- `components/game-card.tsx` — renders `<img src={game.thumb} width={628} height={628} loading="lazy" class="h-full w-full object-cover transition ... group-hover:scale-105">`.
- `app/image/[...path]/route.ts` — thumbnail proxy + disk cache.
- `lib/games.ts` — `thumb: '/image/' + raw.image`.
- `data/games.json` — `image` field (Poki CDN path).
- `components/game-player.tsx` — poster `<img>` on game pages (same class of problem, lower priority).
- `components/search-overlay.tsx` — 80×80 result thumbnails.

### Exact components
- `GameCard` (36 instances on `/`), `GamesSection` (4 sections × 6/12), `GamePlayer` poster, `SearchOverlay` result rows.

### Current behavior (measured)
- **Source dimensions:** from 628×628 up to **6144×6144**; largest cached file **7.33 MB** (`fear-response-logo.png`, 2048×2048); `car-machines-logo.jfif` 6.06 MB / 4000×4000.
- **Cache:** 1,228 files, **616.9 MB**; **161 files > 1 MB**, 231 files 500 KB–1 MB.
- **Displayed size:** `aspect-square` grid, ~235×235 CSS px at `xl` (6 cols), up to ~300 px at `2xl`.
- **Home page payload (on disk):** trending 4.53 MB · new 2.87 MB · action 4.54 MB · puzzle 4.39 MB → **16.32 MB total**. First row (above the fold, 6 cards): **1.97 MB**.
- **LCP element (measured):** `brain-test-4-tricky-friends-logo.png` — 628×628, **127.7 KB**, `<img>`, painted at **3,643 ms**.
- **Request timing (measured):** above-fold images `requestStart ≈ 908–913 ms` (i.e. ~900 ms after nav start, behind render-blocking CSS/JS and early long tasks); first image `responseEnd ≈ 1,264 ms`; below-fold images queue with load delay 369–816 ms.
- **Route behavior:** `export const dynamic = 'force-dynamic'`; reads the **entire file into memory** (`readFile`) then returns it; `Cache-Control: public, max-age=86400` (not `immutable`); cache key is the file path, so it cannot represent variants.
- **Upstream CDN capability (measured):** `img.poki-cdn.com` returns `image/png` even with `Accept: image/webp,image/avif`; `?width=300` → **403**; serves `Cache-Control: public, max-age=31536000` + ETag. **No server-side transforms available** — transformation must happen in our route.
- **Tooling:** `sharp` is present in `node_modules` (transitive via Next), but **not declared** in `package.json`.

### Answers to the specific questions
1. **Above the fold:** the first section's first row — 6 cards at `xl` (2 cards on mobile). ~1.97 MB.
2. **Actual LCP element:** the **first game card `<img>`** (`brain-test-4-…`, `<IMG>`, measured).
3. **Why ~1030 ms resource load delay:** the image request does not start until ~908 ms because it is `loading="lazy"` (low priority) and the main thread is busy with framework JS eval; the browser then prioritizes render-blocking CSS/JS over lazy images. Paint is further delayed to 3.64 s by subsequent long tasks.
4. **Is `loading="lazy"` wrong here?** Yes for the LCP/first-row images — Lighthouse flags it; lazy is correct only for below-the-fold cards.
5. **`fetchpriority="high"`/eager:** apply **only to the first visible image(s)** (first row), not globally. Blanket eager loading would load 16 MB.
6. **Server-side resized thumbnails:** **Yes** — the single highest-impact change. Downscale to ~2× display size (~470 px) — no card needs >~600 px.
7. **WebP/AVIF at ingestion vs request time:** **ingestion (first download)** is best — one-time cost, then serve static variants forever. Request-time conversion re-encodes per cold request and burns CPU.
8. **Should `/image/[...path]` support variants?** **Yes** — e.g. `/image/<hash>/<file>?w=470&f=webp&q=75`, with the variant part of the **cache key** (e.g. `image-cache/<hash>/<file>.w470.webp`). Keep the existing path-traversal guard.
9. **Caching headers:** paths are content-hashed by Poki (`<hash-dir>/<file>`), so serve **`Cache-Control: public, max-age=31536000, immutable`** (the upstream already does). Current 24 h/non-immutable is unnecessarily weak.

### Recommended architecture
- **Ingestion-time transform:** on cache miss, fetch upstream once, then use `sharp` to produce a small set of variants — **`w=470` WebP (primary)** and **`w=240` WebP (mobile/1×)** — store alongside the original; serve the requested variant.
- **Card markup:** point `GameCard` at the `w=470` variant; keep explicit `width`/`height`; use `srcSet` only if a second size is worth it.
- **LCP:** first-row images `loading="eager"` + `fetchpriority="high"` (LCP image) / `auto` (rest of row); everything below stays `loading="lazy"`.
- **Preload:** add `ReactDOM.preload(lcpThumb, { as: 'image', fetchPriority: 'high' })` for the first card.
- **Route:** stream instead of `readFile`; `immutable` caching; keep `force-dynamic` only if needed for first-fetch-on-demand (a static cache dir is fine).
- **Declare `sharp`** in `package.json` before relying on it (package change — deliberately deferred).

### Expected impact
- Card image bytes: **~16.3 MB → ~0.3–0.6 MB** for the same page (≈95–98% reduction); first row **~1.97 MB → ~40–70 KB**.
- LCP: remove ~0.9 s request-start delay and reduce decode/transfer → **LCP 4.2 s → ~1.5–2.0 s** (plus TBT reduction from less decode/decode-adjacent work).
- Lighthouse image savings (~8.26 MB) largely realized.

### Risk
- **Medium.** `sharp` is native and platform-specific (already present transitively). Variant cache grows disk usage (bounded by variants). Changing `<img>` to `srcSet`/eager must preserve CLS = 0 (keep explicit dimensions). AVIF is smaller but slower to encode — prefer WebP first. Must not break the Scramjet game player (unrelated to thumbnails).

## `1zi5eas0-g_6u.js` findings

### Exact modules
Content markers (no source maps available): `AppRouter`, `actionQueue`, `fetchServerResponse`, `createFromFetch`, `resolved_model`/`resolved_module`, route cache, `prefetchHints`, `server-reference`, `Cookie`.

### Source files
**This chunk is the Next.js App Router client runtime** (RSC/Flight decoder + router + prefetch machinery). It is framework code — **do not modify** (same category as `27t_qfc-3_lzs.js`). No application modules were found inside it (`gdn.poki.com`, `GenIcon`, `createAuthClient`, `PhoneNumberUtil` all absent).

### Why it is expensive
The chunk is not inherently heavy (161.9 KB); the CPU is **our component tree driving the runtime**:
- **111 client `<Link>`s hydrate on `/`** (74 sidebar + 36 cards + 1 section link ×4) — each `Link` is a client component that registers prefetch/visibility logic.
- **`SiteShell` is a client component wrapping the entire app**, and `useSession()` resolves after hydration → the shell **and the 75-item `<SidebarNav>`** (rendered as JSX, not `children`) re-render.
- Hydration/render of an **850–865 element** tree; measured long tasks 465/292/175 ms.
- **Verified NOT the cause:** RSC prefetch storm — a headless run measured **0 `_rsc=` requests** on `/` (dynamic routes only prefetch on hover).

### Recommended fix
1. **Shrink the client surface** rather than the framework: extract the header auth area into a small client island so session resolution no longer re-renders the shell + sidebar (this is audit-1 P1-3, now shown to also feed this chunk's CPU).
2. **Reduce hydrating `Link`s:** the 75 sidebar links are static navigation — candidate to render as plain `<a>`/server-rendered links (or virtualize), leaving only cards as client `Link`s. Optionally `prefetch={false}` on the 36 card links to bound prefetch work.
3. **Make game pages static where possible:** `/game/[slug]` and `/game-category/[slug]` are currently `ƒ` (dynamic) despite having no per-request data (category page only needs `?page`). Static generation reduces RSC payload work and enables cheap prefetch.

### Expected impact
- Fewer client components + no shell-wide session re-render → meaningful cut in hydration/render CPU attributed to this chunk (the 292/175 ms tasks and part of the 465 ms task).
- Bounded prefetch work if `prefetch={false}` is adopted.

### Risk
- **Low–medium.** AuthArea refactor is behavior-preserving. Converting sidebar links to plain anchors loses client-side nav for the sidebar only (acceptable; may add full reloads). Static generation of 1,483 game routes increases build time/size.

## DOM / forced reflow findings

Measured DOM: **850–865 elements** (Lighthouse 836).

| Region | Elements | Notes |
|---|---|---|
| Sidebar `<nav id="mainNav">` | **529 (62%)** | 75 items: `a > div > (span > svg > path) + div`; 75 `svg`, 150 `path`, 74 `a`, 75 `span`, 153 `div` |
| `<main>` | 274 | 36 cards (`a > div > img + span`, `div > h3 + p`) + 4 sections |
| Header + shell wrappers | ~47 | |

- **Style & Layout (1,040 ms) contributors:** 529-element sidebar with no `content-visibility`; 75 items using `transition-all`; 36 cards with `hover:-translate-y-1` + `group-hover:scale-105` transitions; 78 SVGs; **Arabic text shaping** (Cairo) across 75 labels + 36 titles (more expensive than Latin).
- **Forced reflow (170 ms):** our client code contains **no load-time layout reads** — the only DOM reads/writes are `window.matchMedia` (sidebar click), `document.querySelector` in `lib/proxy.ts` (on Play only), and `document.body.style.overflow` (search overlay open only). So forced reflow is **not** from our code at load; it is consistent with framework hydration + font swap + large element count. **Confidence: medium-low** — recommend re-measuring forced reflow after the image and client-surface fixes before acting on it.
- **Self-inflicted re-render:** `useSession()` in `SiteShell` re-renders the 75-item sidebar after the session request resolves (same root cause as Part 2).
- **Recommendations (do not implement yet):** `content-visibility: auto` on the sidebar list; virtualize/limit the category list; drop `transition-all` for targeted transitions; keep `font-display: swap` but consider preloading the Arabic subset.

## Recommended implementation order

1. **Image transform pipeline** (ingestion-time WebP variants + declare `sharp`) — biggest byte win, unblocks LCP.
2. **LCP prioritization** (first-row eager + `fetchpriority="high"` + `preload`) — small code change, direct LCP win.
3. **Image route hardening** (variant cache key, `immutable` caching, streaming) — completes Part 1.
4. **Client-surface reduction** (`AuthArea` island; sidebar links off client `Link`; optional `prefetch={false}`) — attacks the 1,341 ms/951 ms chunk CPU and the sidebar re-render.
5. **Static generation for `/game/[slug]` (+ category page 1)** — reduces RSC payload/prefetch cost; optional, larger build.
6. **Sidebar layout cost** (`content-visibility`, targeted transitions) — only after re-measuring forced reflow.

## Things we should NOT change

- **`27t_qfc-3_lzs.js` and `1zi5eas0-g_6u.js`** — Next.js framework/runtime chunks. Not modifiable; optimize by reducing what our tree asks them to do.
- **`react-icons`** — 15.2 KB chunk, named imports + `optimizePackageImports`; not a bottleneck.
- **`COOP: same-origin` + `COEP: require-corp`** in `next.config.ts` — required by the Scramjet/Wisp game player. Do not "optimize" away.
- **`proxy.ts` session gate** and **`data/games.json`** (server-side catalog) — out of scope for this pass.
- **P1/P2 findings from audit #1** not listed above (libphonenumber lazy-load, proxy DB roundtrip, `/image` unbounded eviction) — deferred; do not bundle into this work.
- **UI/behavior** — no visual changes; keep CLS at 0 (explicit image dimensions), keep the 300 ms search debounce and 7-result limit.

## Evidence appendix (measured this session)

- Home card image payload on disk: trending 4.53 MB · new 2.87 MB · action 4.54 MB · puzzle 4.39 MB = **16.32 MB**; first row 1.97 MB.
- LCP: `<IMG>` `brain-test-4-tricky-friends-logo.png`, 127.7 KB, 628×628, **paint 3,643 ms**.
- Image request timing: first 6 images `requestStart ≈ 908–913 ms`, `responseEnd ≈ 1,264–1,429 ms`; later images load delay 369–816 ms.
- Network on `/`: 59 requests, **0 RSC prefetch**, 35 image responses.
- Long tasks: 465 ms @1,676 · 292 ms @851 · 175 ms @649 · 135 ms @4,480 · 62 ms @1,197.
- DOM: 865 elements (sidebar 529, main 274); 78 `svg`/156 `path`.
- CDN: `Accept: image/webp` → `image/png`; `?width=300` → 403; upstream `max-age=31536000`.
- Cache: 1,228 files / 616.9 MB; 161 files > 1 MB.
- `sharp`: present in `node_modules`, **not** in `package.json`.
