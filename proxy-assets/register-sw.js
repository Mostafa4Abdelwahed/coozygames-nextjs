"use strict";
/**
 * Scramjet service worker (served from the site root so it controls the whole origin).
 */
const stockSW = "/sw.js";

/**
 * List of hostnames that are allowed to run serviceworkers on http://
 */
const swAllowedHostnames = ["localhost", "127.0.0.1", "192.168.0.62"];

/**
 * Wisp endpoint.
 *
 * Local dev talks to the standalone Wisp server on port 8081. In production the
 * Wisp server is expected behind the same origin at `/wisp/` (see deploy/), so
 * `wss://<host>/wisp/` is used — this avoids mixed-content and the need to open
 * an extra TLS port. A cross-origin endpoint can be injected at build time via
 * NEXT_PUBLIC_WISP_URL (passed as the argument from lib/proxy.ts), or set on
 * `window.__WISP_URL__` at runtime.
 */
function defaultWispUrl() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  if (swAllowedHostnames.includes(location.hostname)) {
    return proto + "://" + location.hostname + ":8081/wisp/";
  }
  return proto + "://" + location.host + "/wisp/";
}

/**
 * Global util: registers the proxy service worker + Epoxy/Wisp transport.
 * The Wisp server runs as a separate process (see proxy-server/).
 */
async function registerSW(wispUrl) {
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
  const endpoint = wispUrl || window.__WISP_URL__ || defaultWispUrl();
  await connection.setTransport("/epoxy/index.mjs", [{ wisp: endpoint }]);
  await navigator.serviceWorker.register(stockSW);
}
