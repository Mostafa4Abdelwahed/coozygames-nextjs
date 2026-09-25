import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['react-icons'],
  },
  images: {
    localPatterns: [{ pathname: '/image/**' }, { pathname: '/icons/**' }],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Required by Epoxy/BareMux: SharedArrayBuffer is only exposed to
          // cross-origin-isolated contexts, which the game proxy depends on.
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
      {
        // The proxy worker is regenerated on every build (scripts/build-proxy-assets.mjs).
        // Without no-store a browser can keep running a stale worker, so a
        // deployed fix never reaches players.
        source: '/:sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/:register-sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        source: '/:scramjet-init.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        // Installability is judged from this file, so keep it revalidated
        // rather than letting a CDN pin a stale icon set.
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
    ]
  },
};

export default withNextIntl(nextConfig);
