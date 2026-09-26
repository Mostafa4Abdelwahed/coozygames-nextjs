// Copies the proxy runtime (Scramjet/Epoxy/BareMux + our worker scripts) into public/.
// Run before `next dev` / `next build` (see package.json scripts).
import { cp, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsSrc = path.join(root, "proxy-assets");
const publicDir = path.join(root, "public");

const vendors = [
  {
    name: "scramjet",
    desc: "scramjet",
    src: path.join(root, "node_modules", "@mercuryworkshop", "scramjet", "dist"),
    dest: path.join(publicDir, "scram"),
  },
  {
    name: "epoxy",
    desc: "epoxy-transport",
    src: path.join(root, "node_modules", "@mercuryworkshop", "epoxy-transport", "dist"),
    dest: path.join(publicDir, "epoxy"),
  },
  {
    name: "baremux",
    desc: "bare-mux",
    src: path.join(root, "node_modules", "@mercuryworkshop", "bare-mux", "dist"),
    dest: path.join(publicDir, "baremux"),
  },
];

// Full Poki CSS shim: rewrites url(...) inside CSS that games inject at runtime.
// Scramjet does not rewrite these paths, so fonts stall complex games (~96%).
// Covers: style.appendChild(createTextNode), style.textContent/innerHTML,
// CSSStyleSheet.insertRule/replace/replaceSync, plus already-present <style> tags.
const POKI_CSS_SHIM = `
;(function () {
    if (typeof document === "undefined" || typeof Node === "undefined") return;
    try { window.__pokiCssShim = 2; } catch (e) {}
    function rw(u) {
        if (!u || /^(data:|blob:|#)/.test(u)) return u;
        if (/^\\/scramjet\\//.test(u)) return u;
        try {
            var base = location.href;
            var marker = "/scramjet/";
            var idx = base.indexOf(marker);
            if (idx >= 0) {
                var enc = base.slice(idx + marker.length).split("#")[0];
                try { base = decodeURIComponent(enc); } catch (e) {}
            }
            return marker + encodeURIComponent(new URL(u, base).href);
        } catch (e) {
            return u;
        }
    }
    function rc(t) {
        if (typeof t !== "string" || t.indexOf("url(") < 0) return t;
        return t.replace(/url\\(([^)]*)\\)/g, function (m, x) {
            var q = "";
            x = x.trim();
            var c = x.charAt(0);
            if (c === '"' || c === "'") { q = c; x = x.slice(1, -1); }
            return "url(" + q + rw(x) + q + ")";
        });
    }
    try {
        var ap = Node.prototype.appendChild;
        Node.prototype.appendChild = function (ch) {
            try {
                if (this.tagName === "STYLE" && ch && ch.nodeType === 3) {
                    ch.textContent = rc(ch.textContent);
                }
            } catch (e) {}
            return ap.call(this, ch);
        };
    } catch (e) {}
    try {
        var se = HTMLStyleElement.prototype;
        var td = Object.getOwnPropertyDescriptor(Node.prototype, "textContent");
        var ih = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
        if (td && td.set) {
            Object.defineProperty(se, "textContent", {
                configurable: true, enumerable: td.enumerable,
                get: td.get,
                set: function (v) { td.set.call(this, rc(v)); }
            });
        }
        if (ih && ih.set) {
            Object.defineProperty(se, "innerHTML", {
                configurable: true, enumerable: ih.enumerable,
                get: ih.get,
                set: function (v) { ih.set.call(this, rc(v)); }
            });
        }
    } catch (e) {}
    try {
        var ss = CSSStyleSheet.prototype;
        if (ss.insertRule) {
            var ir = ss.insertRule;
            ss.insertRule = function (rule, index) { return ir.call(this, rc(rule), index); };
        }
        if (ss.replace) {
            var rp = ss.replace;
            ss.replace = function (t) { return rp.call(this, rc(t)); };
        }
        if (ss.replaceSync) {
            var rs = ss.replaceSync;
            ss.replaceSync = function (t) { rs.call(this, rc(t)); };
        }
    } catch (e) {}
    try {
        var styles = document.querySelectorAll("style");
        for (var i = 0; i < styles.length; i++) {
            var st = styles[i];
            var cur = st.textContent;
            var fixed = rc(cur);
            if (fixed !== cur) st.textContent = fixed;
        }
    } catch (e) {}
})();
`;

// Poki SDK shim: neuters rewarded/commercial break ads so games grant the reward
// (skip level, extra life, etc.) without waiting for or playing an ad. Appended to
// scramjet.all.js so it executes inside every proxied game document, before the
// game's own scripts. Network ad-blocking lives in sw.js; this handles games that
// gate progression on SDK callbacks that a blocked network request would never fire.
const POKI_SDK_SHIM = `
;(function () {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    try {
        if (window.__adblockSdkShim === 1) return;
        window.__adblockSdkShim = 1;
    } catch (e) { return; }

    function wrapInit(sdk) {
        if (!sdk || sdk.__adblockInitWrapped) return;
        var original = sdk.init;
        if (typeof original !== "function") return;
        sdk.init = function () {
            var p;
            try { p = original.apply(this, arguments); }
            catch (e) { return Promise.resolve(); }
            if (p && typeof p.then === "function") {
                return Promise.race([
                    p,
                    new Promise(function (resolve) { setTimeout(resolve, 3000); })
                ]);
            }
            return p;
        };
        try { sdk.__adblockInitWrapped = true; } catch (e) {}
    }

    function patch(sdk) {
        if (!sdk || (typeof sdk !== "object" && typeof sdk !== "function")) return sdk;
        function noop() {}
        try {
            sdk.rewardedBreak = function (cb) {
                if (typeof cb === "function") { try { cb(true); } catch (e) {} }
                return Promise.resolve(true);
            };
        } catch (e) {}
        try {
            sdk.commercialBreak = function (cb) {
                if (typeof cb === "function") { try { cb(); } catch (e) {} }
                return Promise.resolve();
            };
        } catch (e) {}
        try { sdk.rewardedBreakEnd = function (cb) { if (typeof cb === "function") cb(true); }; } catch (e) {}
        try { sdk.gameLoadingFinished = noop; } catch (e) {}
        try { sdk.gameplayStart = noop; } catch (e) {}
        try { sdk.gameplayStop = noop; } catch (e) {}
        try { sdk.setDebug = noop; } catch (e) {}
        try { sdk.isAdBlocked = function () { return false; }; } catch (e) {}
        try { if (typeof sdk.getLanguage !== "function") sdk.getLanguage = function () { return "en"; }; } catch (e) {}
        wrapInit(sdk);
        return sdk;
    }

    var current;
    try { current = window.PokiSDK ? patch(window.PokiSDK) : undefined; } catch (e) { current = undefined; }

    try {
        Object.defineProperty(window, "PokiSDK", {
            configurable: true,
            enumerable: true,
            get: function () { return current; },
            set: function (v) { current = patch(v); }
        });
    } catch (e) {}

    var ticks = 0;
    var iv = setInterval(function () {
        ticks++;
        try { if (window.PokiSDK) patch(window.PokiSDK); } catch (e) {}
        if (ticks > 240) clearInterval(iv);
    }, 250);
})();
`;

async function copyTree(src, dest) {
  await mkdir(dest, { recursive: true });
  await cp(src, dest, { recursive: true, force: true });
}

// 1) our worker/init scripts
for (const f of ["sw.js", "scramjet-init.js", "register-sw.js"]) {
  await rm(path.join(publicDir, f), { recursive: true, force: true });
  await copyFile(path.join(assetsSrc, f), path.join(publicDir, f));
  console.log(`[proxy-assets] copied proxy-assets/${f} -> public/${f}`);
}

// 2) vendor bundles
for (const v of vendors) {
  await rm(v.dest, { recursive: true, force: true });
  await copyTree(v.src, v.dest);
  console.log(`[proxy-assets] copied ${v.desc} -> ${path.relative(root, v.dest)}`);
}

// 3) append full CSS shim + adblock SDK shim to scramjet.all.js
const scramjetAll = path.join(publicDir, "scram", "scramjet.all.js");
const bundle = (await readFile(scramjetAll, "utf8")) + POKI_CSS_SHIM + POKI_SDK_SHIM;
await writeFile(scramjetAll, bundle);
console.log("[proxy-assets] appended Poki CSS shim + adblock SDK shim to public/scram/scramjet.all.js");
