"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MdArrowForward, MdFullscreen, MdRefresh } from "react-icons/md";
import { createGameFrame, ensureProxy, type SjFrame } from "@/lib/proxy";

type Status = "loading" | "ready" | "error";

/** Give up waiting for the game to render after this long and offer a retry. */
const MAX_WAIT_MS = 60_000;
const POLL_MS = 400;

/**
 * True once the proxied document has actually rendered something.
 * The frame is same-origin (Scramjet serves it under /scramjet/), so the
 * content document is readable.
 */
function hasRendered(iframe: HTMLIFrameElement | null): boolean {
  try {
    const doc = iframe?.contentDocument;
    if (!doc) return false;
    const canvas = doc.querySelector("canvas") as HTMLCanvasElement | null;
    if (canvas && canvas.width > 0) return true;
    const text = (doc.body?.innerText || "").trim();
    return text.length > 20;
  } catch {
    return false;
  }
}

/**
 * Full-screen game stage for /play/[slug].
 * Keeps the loading overlay up until the game document renders, not merely
 * until navigation starts.
 */
export function GameStage({
  title,
  slug,
  playUrl,
  backHref,
}: {
  title: string;
  slug: string;
  playUrl?: string;
  backHref: string;
}) {
  const t = useTranslations("GameStage");
  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const frameRef = useRef<SjFrame | null>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | undefined;

    async function run() {
      if (!playUrl) {
        setStatus("error");
        return;
      }
      setStatus("loading");
      try {
        await ensureProxy();
        if (cancelled || !iframeRef.current) return;
        if (!trackedRef.current) {
          trackedRef.current = true;
          fetch("/api/track/play", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
            keepalive: true,
          }).catch(() => null);
        }
        if (!frameRef.current) frameRef.current = createGameFrame(iframeRef.current);
        frameRef.current.go(playUrl);

        const startedAt = Date.now();
        poll = setInterval(() => {
          if (cancelled) return;
          if (hasRendered(iframeRef.current)) {
            if (poll) clearInterval(poll);
            setStatus("ready");
            return;
          }
          if (Date.now() - startedAt > MAX_WAIT_MS) {
            if (poll) clearInterval(poll);
            setStatus("error");
          }
        }, POLL_MS);
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    run();
    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
    };
  }, [playUrl, slug, attempt]);

  function goFullscreen() {
    const el = boxRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen().catch(() => null);
    }
  }

  return (
    <div ref={boxRef} className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-night-60 bg-night-80 px-3">
        <Link
          href={backHref}
          aria-label={t("backToGame")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-mist-90 transition-colors hover:text-white"
        >
          <MdArrowForward size={22} />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-base font-extrabold text-white">{title}</h1>
        <button
          type="button"
          onClick={goFullscreen}
          aria-label={t("fullscreen")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-mist-90 transition-colors hover:text-white"
        >
          <MdFullscreen size={22} />
        </button>
      </div>

      <div className="relative flex-1">
        <iframe
          ref={iframeRef}
          title={title}
          allowFullScreen
          allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"
          className="absolute inset-0 h-full w-full border-0"
        />

        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-night-60 border-t-brand-100" />
            <p className="text-sm font-bold text-mist-50">{t("loading")}</p>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 p-6 text-center">
            <MdRefresh size={36} className="text-mist-50" />
            <p className="font-bold text-white">{t("failedToLoad")}</p>
            <p className="text-sm text-mist-50" dir="ltr">
              Run: npm run wisp
            </p>
            <button
              type="button"
              onClick={() => setAttempt((v) => v + 1)}
              className="rounded-full bg-brand-100 px-5 py-2 text-sm font-extrabold text-white transition-colors hover:bg-brand-80"
            >
              {t("retry")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}