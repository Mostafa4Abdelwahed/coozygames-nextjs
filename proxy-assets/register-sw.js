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
 * Global util: registers the proxy service worker + Epoxy/Wisp transport.
 * The Wisp server runs as a separate process (see proxy-server/).
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
  const WISP_PORT = 8081;
  let wispUrl =
    (location.protocol === "https:" ? "wss" : "ws") +
    "://" +
    (location.hostname || "localhost") +
    (WISP_PORT ? ":" + WISP_PORT : "") +
    "/wisp/";
  await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
  await navigator.serviceWorker.register(stockSW);
}
