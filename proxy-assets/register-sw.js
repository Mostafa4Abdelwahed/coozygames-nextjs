"use strict";
/**
 * Scramjet service worker (served from the site root so it controls the whole origin).
 */
const stockSW = "/sw.js";

/**
 * List of hostnames that are allowed to run serviceworkers on http://
 */
const swAllowedHostnames = ["localhost", "127.0.0.1"];

/**
 * Resolves the Wisp endpoint:
 *   1. WISP_URL from the server env (injected by /api/wisp-config at runtime)
 *   2. fallback: <current host>:8081/wisp/ (local development)
 */
function resolveWispUrl() {
  const configured =
    typeof window !== "undefined" && typeof window.__WISP_URL__ === "string"
      ? window.__WISP_URL__.trim()
      : "";

  if (configured) {
    return configured.endsWith("/") ? configured : configured + "/";
  }

  const WISP_PORT = 8081;
  return (
    (location.protocol === "https:" ? "wss" : "ws") +
    "://" +
    (location.hostname || "localhost") +
    (WISP_PORT ? ":" + WISP_PORT : "") +
    "/wisp/"
  );
}

/**
 * Global util: registers the proxy service worker + Epoxy/Wisp transport.
 */
async function registerSW() {
  if (!navigator.serviceWorker) {
    if (
      location.protocol !== "https:" &&
      !swAllowedHostnames.includes(location.hostname)
    )
      throw new Error("Service workers cannot be registered without https.");

    throw new Error("Your browser doesn't support service workers.");
  }
  const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

  // Register the EpoxyClient transport to be used for network requests
  const wispUrl = resolveWispUrl();
  await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
  await navigator.serviceWorker.register(stockSW);
}
