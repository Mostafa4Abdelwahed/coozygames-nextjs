# Next.js Performance Audit — CoozyGames

- **Date:** 2026-09-22
- **Method:** Vercel React Best Practices skill (70 rules, 8 categories) applied against actual source + production bundle evidence from `.next/` (no rebuild was run; chunk attribution via content markers + `build-manifest.json` + `*_client-reference-manifest.js`).
- **Lighthouse context (provided):** Performance ~80 · FCP ~0.8s · LCP 1.9s (later 1.5s) · TBT 820ms (later 700ms) · main-thread ~3.0s · one ~411ms long task · unused JS ~29.3KB · `27t_qfc-3_lzs.js` ~70KB (gzipped scale).
- **Status:** Audit only. No source files modified, no packages changed, no commits.

## Bundle evidence (measured, `.next/static/chunks`)

| Chunk (raw size) | Content (verified by markers/manifests) | Loaded on initial `/` |
|---|---|---|
| `1lw7ohzrr_qom.js` — **680.4 KB** | Games catalog (`gdn.poki.com` strings = `data/games.json`) | **Yes** — referenced by `/` route client manifest (via sidebar chain, see P0-1) |
| `3srid-s7iipvw.js` — **566.9 KB** | `google-libphonenumber` (`PhoneNumberUtil`) | No — only `/login`, `/register`, `/complete` route manifests |
| `27t_qfc-3_lzs.js` — **223.8 KB** | React-DOM + Next client runtime (`ReactCurrentOwner`, `link`, `Image`) | **Yes** — in `rootMainFiles` for `/` |
| `1zi5eas0-g_6u.js` — 161.9 KB | Framework/vendor shared (no app markers) | Yes — in `rootMainFiles` |
| `0cz1d0mv5g_q7.js` — 110 KB | Core-js-style polyfills (`globalThis` UMD) | Polyfill chunk (legacy browsers) |
| `05u_utx9-mlyt.js` — 33.5 KB | better-auth client (`nanostores`, `createAuthClient`) | Yes — shell + most routes |
| `0zd9-acsdxuwh.js` — 33 KB | next/font + session helpers | Shared |
| `19mx3mg6lkumu.js` — 28.2 KB | Route-level shared | Shared |

> `27t_qfc-3_lzs.js` verdict: **Next.js framework runtime, not app code.** ~224KB raw ≈ ~70KB gzip, matching the report. Irreducible without leaving Next.js. The 29.3KB "unused JS" is consistent with framework + icon leftovers, not a smoking gun in app code.

## Findings

### P0-1 — 707KB games catalog ships in the initial client bundle
- **File:** `lib/games.ts:20` (`import catalog from '@/data/games.json'`, 707,409 bytes on disk → 680KB chunk)
- **Chain:** `components/site-shell.tsx` → `components/sidebar-nav.tsx:4` → `lib/categories.ts:3` → `lib/games.ts:20`
- **Skill rules:** `bundle-*` (bundle size), `server-serialization`
- **Problem:** The sidebar needs ~100 category slugs/labels, but the import chain drags all 1483 full game objects (titles, `playUrl` gdn URLs, thumbs, pseudo-stats) plus 18 `react-icons/md` modules into every page's initial JS.
- **Why it hurts:** ~600KB+ extra download + parse/compile on the main thread on first paint; prime suspect for the ~411ms long task and a large share of TBT. The catalog is *used* (sidebar derives categories), so Lighthouse reports it as code rather than "unused" — which is why unused-JS looks small while TBT stays high.
- **Fix:** Split the data layer. New tiny `lib/catalog-index.ts` (slug/title/categorySlug per game, or slug→categories map only) for sidebar + search; keep full `Game` objects server-side only. Move search filtering to `GET /api/games/search?q=` (server filters, returns ≤7 slim rows) instead of client-side `useMemo` over `ALL_GAMES`.
- **Expected impact:** ~600KB raw (~100KB+ gzip) off initial JS; largest single TBT/LCP lever in this audit.
- **Risk:** Low–medium. Touches search UX (adds network roundtrip ~ms, keeps 300ms debounce) and sidebar data source. No visual change.

### P1-1 — `google-libphonenumber` (567KB) on auth routes
- **Files:** `lib/phone.ts:1` ← `login-form.tsx:9`, `register-form.tsx`, `complete-profile-form.tsx`
- **Skill rules:** `bundle-conditional`, `bundle-dynamic-imports`
- **Problem:** Full metadata build (`PhoneNumberUtil` + all region metadata) bundled into `/login`, `/register`, `/complete` route chunks (verified: 567KB chunk only in those three manifests). Correctly absent from initial load.
- **Why it hurts:** ~500KB+ parse on auth pages; `getInstance()` + `parse`/`isValidNumber` run synchronously in submit/blur handlers.
- **Fix:** `await import('@/lib/phone')` lazily inside submit/blur handlers (keep regex pre-check synchronous), or validate via existing server endpoints (`/api/check-unique`, `/api/profile/phone` already use libphonenumber server-side).
- **Expected impact:** ~500KB off auth-route JS; zero initial-load impact (already split).
- **Risk:** Low. Minor async refactor; keep sync regex fast-path for instant feedback.

### P1-2 — `proxy.ts` does a DB session lookup on every navigation
- **File:** `proxy.ts:16-18` (`auth.api.getSession` → Postgres `pool.query`)
- **Skill rules:** `server-*` (server response latency feeds TTFB → LCP/SI)
- **Problem:** Every matched request pays a DB roundtrip before the page can start rendering — for logged-in users on every navigation. Anonymous fast-path exists only implicitly (no cookie → null without DB, but still runs the call + `headers()`).
- **Why it hurts:** Adds server latency to TTFB on all navigations; also runs on static-asset-adjacent paths (matcher only excludes `api`, `_next/*`, `favicon.ico`).
- **Fix:** better-auth cookie-cache session (signed cookie session, no DB hit) or `getSessionCookie` fast-path in proxy + keep authoritative checks at page level (already present: `profile`, `complete`, `login`, `register` all call `getSession` server-side).
- **Expected impact:** −1 DB roundtrip per navigation TTFB for authed users.
- **Risk:** Low. This is better-auth's documented pattern; page-level guards remain authoritative.

### P1-3 — `useSession()` in `SiteShell` re-renders the entire shell
- **File:** `components/site-shell.tsx:20` (+ `handleLogout`, `isPending` skeleton at `:69`)
- **Skill rules:** `rerender-*` (whole-tree subscription), `client-*` (fetch on mount)
- **Problem:** Session state lives at the root: header + sidebar + `<main>{children}</main>` all re-render when the session fetch resolves; plus an extra `/api/auth/get-session` request in the critical post-hydration window and an `isPending` skeleton swap in the header.
- **Why it hurts:** Unnecessary reconciliation of the whole tree + main-thread fetch handling right after hydration; skeleton swap is a (currently zero-CLS, but fragile) visual swap.
- **Fix:** Extract a tiny `AuthArea` client island (right side of header only: login button ↔ avatar/logout). Shell stays static; session fetch + re-render scoped to ~3 nodes.
- **Expected impact:** Small–medium (less hydration/re-render work, cleaner loading states).
- **Risk:** Low. Pure refactor, no behavior change.

### P1-4 — Client-side search filters 1483 full objects per keystroke cycle
- **File:** `components/search-overlay.tsx:34-43` (`useMemo` over `ALL_GAMES`, incl. `categoryLabelAr` lookup per item)
- **Skill rules:** `js-*`, `rerender-*`
- **Problem:** O(n) filter over rich objects on the main thread; depends on the 680KB module being parsed first (see P0-1).
- **Why it hurts:** Combined with P0-1 it's main-thread work + memory; alone it's ~1–3ms (minor).
- **Fix:** Covered by P0-1 fix (server-side `/api/games/search`). Optionally add `useDeferredValue`/`startTransition` (`rerender-use-deferred-value`, `rerender-transitions`) to keep input responsive.
- **Expected impact:** Medium (with P0-1); low alone.
- **Risk:** Low.

### P2-1 — LCP images use plain lazy `<img>`, no priority
- **Files:** `components/game-card.tsx` (`<img loading="lazy" width=628 height=628>`), `game-player.tsx` poster
- **Skill rules:** `rendering-*`
- **Problem:** Above-the-fold thumbnails are `loading="lazy"` with no `fetchPriority`; no `next/image` sizing/optimization. If the LCP element is a card thumbnail (likely on `/`), lazy delays it.
- **Why it hurts:** Direct LCP regression risk (~100–300ms).
- **Fix:** `fetchPriority="high"` (+ `loading="eager"`) on first-row card image and player poster; evaluate `next/image` for `/image/*` thumbs.
- **Expected impact:** Small–medium LCP win. **Risk:** Low. (CLS currently 0 — keep explicit width/height.)

### P2-2 — `/image/*` route: full-file buffering, weak caching
- **File:** `app/image/[...path]/route.ts:122-126` (`readFile` whole file; `Cache-Control: public, max-age=86400`, `force-dynamic`)
- **Skill rules:** `server-*`
- **Problem:** Every thumbnail request buffers the entire file into memory; 24h cache without `immutable` forces revalidation traffic; disk cache never evicts (unbounded growth noted in code comments elsewhere).
- **Why it hurts:** Server memory/CPU per image + repeat downloads. Not initial-load JS, but gallery pages fire dozens of these.
- **Fix:** Stream the file (`createReadStream`/`ReadableStream`), `max-age=31536000, immutable` (paths are content hashes), add size cap + LRU eviction for `image-cache/`.
- **Expected impact:** Small (server + repeat-visit). **Risk:** Low.

### P2-3 — Global `COOP: same-origin` + `COEP: require-corp`
- **File:** `next.config.ts:7-17`
- **Skill rules:** compat/`rendering-*` (required by Scramjet/Wisp game player)
- **Problem:** Correct for the game player, but global. `COOP: same-origin` breaks popup-based OAuth flows; `require-corp` blocks non-CORP cross-origin subresources.
- **Why it hurts:** Latent breakage risk when Google OAuth is enabled (`auth.ts` has conditional `socialProviders.google`); currently redirect flow is unaffected, but any popup/embed addition will fail opaquely.
- **Fix:** Verify Google sign-in end-to-end once keys are configured; consider scoping COOP/COEP to `/game/*` if issues arise.
- **Expected impact:** None today (correctness guard). **Risk:** Medium if ignored at OAuth enablement.

### P2-4 — Sidebar hydrates ~70 items on every page; empty iframe per game page
- **Files:** `sidebar-nav.tsx:35-47` (70 `SidebarItem`), `game-player.tsx:66-72` (always-mounted empty iframe), `game-player.tsx:13` (`frameRef` assigned, never read)
- **Skill rules:** `rendering-content-visibility`, `rendering-*`, cleanliness
- **Problem:** Entire nav list hydrates on each navigation although labels are hidden on desktop-collapsed; game page creates a nested browsing context before Play is pressed.
- **Why it hurts:** Linear hydration cost ×70 nodes; wasted iframe process/memory.
- **Fix:** `content-visibility: auto` on the nav list (`rendering-content-visibility`); render `<iframe>` only after `playing=true`; remove dead `frameRef`.
- **Expected impact:** Small. **Risk:** Trivial.

### P2-5 — Minor: sync `localStorage` write in proxy transport setup; `downloadsInFlight` unbounded Map
- **Files:** `proxy-assets/register-sw.js` (`localStorage bare-mux-path` set on each registration), `app/image/[...path]/route.ts:9`
- **Skill rules:** `js-cache-storage`, `js-*`
- **Problem:** Negligible today (registration is once-per-click-to-play; map entries are deleted in `finally`). Listed for completeness only.
- **Why it hurts:** Essentially nothing. No action needed unless player open-rate is profiled as hot.
- **Risk:** None.

### Verified OK (no action)
- **react-icons is NOT a performance problem.** Named `react-icons/md` imports + `experimental.optimizePackageImports: ['react-icons']` (`next.config.ts:5`) → per-icon modules; `import type { IconType }` is type-only. No barrel import. Matches the latest Lighthouse (no longer flagged).
- **Fonts:** Cairo `arabic+latin`, 4 weights, `next/font` self-hosted with `display: swap` (`layout.tsx:6-10`). No third-party font requests.
- **Home route is static** (`app/page.tsx` has no `searchParams`/headers → prerendered). `games`/`game-category` are dynamic out of necessity (`?sort`, `?page`).
- **SearchOverlay is `next/dynamic` + `ssr:false`** (`site-shell.tsx:13-16`) — correct code-splitting instinct; its weight is the catalog data, not the component (see P0-1).
- **No server→client leaks:** no `pg`, `better-auth` server, or `google-libphonenumber` imports in the 8 client files except route-scoped auth forms (login/register/complete import `lib/phone` → 567KB chunk, correctly absent from initial load). `Game.icon` component refs never cross an RSC boundary as props to client components (all consumers server-side; `GamePlayer` receives strings only).
- **`useSearchParams` correctly wrapped in `<Suspense>`** (`site-shell.tsx:126-128`); static fallback renders identical list.
- **No fetch waterfalls in pages** (`async-*`): all page data is synchronous in-memory filtering; API routes do single queries (`async-api-routes` OK). No `Promise.all` opportunities missed (single awaits only).

## Top 5 opportunities by measurable impact

1. **P0-1 — catalog out of the client bundle** (~600KB raw off initial JS; biggest TBT/LCP lever).
2. **P1-1 — lazy-load `google-libphonenumber`** (~500KB off `/login|/register|/complete` route chunks).
3. **P1-2 — proxy session fast-path** (−1 DB roundtrip of TTFB on every authed navigation).
4. **P1-3 — `AuthArea` island** (isolate session fetch + re-render to 3 header nodes).
5. **P2-1 + P2-4 — LCP image priority + sidebar `content-visibility`** (LCP polish + cheaper hydration).

## Notes / assumptions
- Chunk sizes are raw bytes from `.next/static/chunks`; gzip ratios estimated (~3× for JSON/text).
- The ~411ms long task was not re-profiled here; attribution (initial JS parse/compile + shell hydration, catalog module as prime suspect) is evidence-backed but not a substitute for a DevTools trace — recommend confirming with `npm run build && npm start` + Performance panel (lab runs must be incognito, per Lighthouse's own IndexedDB warning).
- `COOP/COEP` must stay for the Scramjet player (do not "optimize" away).
- `data/games.json` (707KB) is also bundled server-side — harmless there (module-eval once), but `buildGames()` runs slugify+classify over 1483 items at server startup; negligible.
