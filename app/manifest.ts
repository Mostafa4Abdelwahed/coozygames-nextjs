import type { MetadataRoute } from "next";

// Colours come from app/globals.css and the brand artwork
// (assets/coozygames-icon.svg), see scripts/build-pwa-icons.mjs.
const THEME_COLOR = "#0c0d14";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "كوزي جيم — Coozy Games",
    short_name: "كوزي جيم",
    description: "العب أحلى الألعاب أونلاين مجاناً",
    lang: "ar",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Games want the whole screen, and portrait-locking would break landscape
    // play, so both are offered instead of forcing an orientation.
    display_override: ["fullscreen", "standalone", "minimal-ui"],
    orientation: "any",
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    categories: ["games", "entertainment"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
