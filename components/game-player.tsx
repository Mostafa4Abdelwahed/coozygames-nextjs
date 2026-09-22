'use client'

import { useRef, useState } from 'react'
import { MdFullscreen, MdPlayArrow, MdRefresh } from 'react-icons/md'
import { ensureProxy, openGameFrame } from '@/lib/proxy'
import type { SjFrame } from '@/lib/proxy'

export function GamePlayer({ title, thumb, playUrl }: { title: string; thumb?: string; playUrl?: string }) {
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const frameRef = useRef<SjFrame | null>(null)

  async function handlePlay() {
    if (!playUrl || !iframeRef.current) {
      setPlaying(true)
      return
    }
    setPlaying(true)
    setFailed(false)
    try {
      await ensureProxy()
      frameRef.current = openGameFrame(iframeRef.current, playUrl)
    } catch {
      setFailed(true)
    }
  }

  function goFullscreen() {
    const el = boxRef.current
    if (!el) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void el.requestFullscreen().catch(() => null)
    }
  }

  return (
    <div ref={boxRef} className="relative aspect-video w-full overflow-hidden rounded-2xl border border-night-60 bg-black">
      {!playing && (
        <button
          type="button"
          onClick={handlePlay}
          aria-label={`العب ${title} الآن`}
          className="group absolute inset-0 z-10 flex h-full w-full flex-col items-center justify-center gap-3"
        >
          {thumb && (
            <img
              src={thumb}
              alt=""
              aria-hidden="true"
              width={628}
              height={628}
              className="absolute inset-0 h-full w-full object-cover opacity-40 transition duration-300 group-hover:opacity-50"
            />
          )}
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-white shadow-2xl transition duration-200 group-hover:scale-105 group-hover:bg-brand-80">
            <MdPlayArrow size={44} />
          </span>
          <span className="relative text-lg font-extrabold text-white">العب الآن</span>
        </button>
      )}

      <iframe
        ref={iframeRef}
        title={title}
        allowFullScreen
        allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"
        className={`absolute inset-0 h-full w-full border-0 ${playing ? 'visible' : 'invisible'}`}
      />

      {playing && failed && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/85 p-6 text-center">
          <MdRefresh size={36} className="text-mist-50" />
          <p className="font-bold text-white">تعذر تشغيل اللعبة (سيرفر البروكسي مطفي؟)</p>
          <p className="text-sm text-mist-50" dir="ltr">
            Run: npm run wisp
          </p>
          <button
            type="button"
            onClick={() => {
              setPlaying(false)
              setFailed(false)
            }}
            className="rounded-full bg-brand-100 px-5 py-2 text-sm font-extrabold text-white transition hover:bg-brand-80"
          >
            رجوع
          </button>
        </div>
      )}

      {playing && !failed && (
        <button
          type="button"
          onClick={goFullscreen}
          aria-label="ملء الشاشة"
          className="absolute end-3 bottom-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
        >
          <MdFullscreen size={22} />
        </button>
      )}
    </div>
  )
}
