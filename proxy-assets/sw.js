importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

// Poki's game hosts (games.poki.com, *.gdn.poki.com, game-cdn.poki.com, api.poki.com)
// reject any request whose Referer isn't poki.com with a 403. Scramjet forwards a
// Referer derived from the proxied page, so we force a valid Poki referer here.
const POKI_HOST = /(^|\.)poki\.com$/i;
const POKI_CDN_HOST = /(^|\.)poki-cdn\.com$/i;

// Ad/tracker hostnames blocked at the proxy choke point. Covers the major ad
// networks, exchanges and trackers that web games typically pull in. Matching is
// on the exact host or any subdomain, so first-party game/Poki hosts are never hit.
const AD_HOSTNAMES = [
    "doubleclick.net",
    "googlesyndication.com",
    "googleadservices.com",
    "googletagservices.com",
    "googletagmanager.com",
    "google-analytics.com",
    "adservice.google.com",
    "2mdn.net",
    "adnxs.com",
    "rubiconproject.com",
    "pubmatic.com",
    "openx.net",
    "criteo.com",
    "criteo.net",
    "taboola.com",
    "outbrain.com",
    "scorecardresearch.com",
    "quantserve.com",
    "amazon-adsystem.com",
    "adsafeprotected.com",
    "moatads.com",
    "teads.tv",
    "spotxchange.com",
    "spotx.tv",
    "33across.com",
    "sharethrough.com",
    "triplelift.com",
    "smartadserver.com",
    "adform.net",
    "casalemedia.com",
    "indexww.com",
    "adcolony.com",
    "applovin.com",
    "vungle.com",
    "inmobi.com",
    "chartboost.com",
    "fyber.com",
    "adcash.com",
    "propellerads.com",
    "propellerpops.com",
    "popads.net",
    "adsterra.com",
    "exoclick.com",
    "juicyads.com",
    "trafficjunky.net",
    "mgid.com",
    "revcontent.com",
    "zedo.com",
    "bidvertiser.com",
    "adsrvr.org",
    "improvedigital.com",
    "serving-sys.com",
    "sizmek.com",
    "yieldmo.com",
    "crwdcntrl.net",
    "agkn.com",
    "advertising.com",
    "districtm.io",
    "sovrn.com",
    "lijit.com",
    "gumgum.com",
    "undertone.com",
    "rhythmone.com",
    "bidswitch.net",
    "adroll.com",
    "bluekai.com",
    "demdex.net",
    "everesttech.net",
    "krxd.net",
    "tapad.com",
    "crazyegg.com",
    "hotjar.com",
    "mouseflow.com",
    "clarity.ms",
];

const AD_HOST_RE = new RegExp(
    "(^|\\.)(" +
        AD_HOSTNAMES.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") +
        ")$",
    "i"
);

/**
 * Synthetic response for a blocked request. Content type follows the requested
 * resource so scripts/styles/JSON fail quietly instead of throwing parse errors.
 */
function blockedResponse(url) {
    let type = "";
    try {
        const path = new URL(String(url), "https://blocked.invalid/").pathname.toLowerCase();
        if (path.endsWith(".js") || path.endsWith(".mjs")) type = "application/javascript";
        else if (path.endsWith(".css")) type = "text/css";
        else if (path.endsWith(".json")) type = "application/json";
        else if (/\.(png|jpe?g|gif|webp|svg|ico)$/.test(path)) type = "image/gif";
    } catch {
        // non-URL, fall through with no content type
    }
    return new Response(type === "application/json" ? "{}" : "", {
        status: 200,
        statusText: "OK",
        headers: type ? { "content-type": type } : {},
    });
}

const bareFetch = scramjet.client.fetch.bind(scramjet.client);

scramjet.client.fetch = function (url, options) {
    let host = "";
    try {
        host = new URL(typeof url === "string" ? url : url.toString()).hostname;
    } catch {
        return bareFetch(url, options);
    }

    if (AD_HOST_RE.test(host)) {
        return Promise.resolve(blockedResponse(url));
    }

    if (POKI_HOST.test(host) || POKI_CDN_HOST.test(host)) {
        options.headers = Object.assign({}, options.headers, {
            referer: "https://poki.com/",
            origin: "https://poki.com",
        });
    }
    return bareFetch(url, options);
};

async function handleRequest(event) {
    await scramjet.loadConfig();
    if (scramjet.route(event)) {
        return scramjet.fetch(event);
    }
    return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event));
});
