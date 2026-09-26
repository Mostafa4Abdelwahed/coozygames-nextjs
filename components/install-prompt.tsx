'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { MdClose, MdInstallMobile, MdIosShare } from 'react-icons/md'

const DISMISS_KEY = 'coozy-install-dismissed'

// The BeforeInstallPromptEvent shape we use. The real event type is not in
// lib.dom yet, so it is narrowed here rather than cast to any.
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const noopSubscribe = () => () => {}

// False on the server and during the first client render, true afterwards.
// Reading matchMedia/localStorage/navigator during render would otherwise
// mismatch hydration.
const useHydrated = () => useSyncExternalStore(noopSubscribe, () => true, () => false)

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

const isDismissed = () => window.localStorage.getItem(DISMISS_KEY) === '1'

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !(navigator as Navigator & { MSStream?: unknown }).MSStream

/**
 * Offers to install the app. Chrome/Edge/Android get a real install button via
 * `beforeinstallprompt`; iOS Safari never fires that event, so it gets written
 * instructions instead. Nothing renders for a browser that supports neither.
 */
export function InstallPrompt() {
  const hydrated = useHydrated()
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const onPrompt = (event: Event) => {
      // Suppress the browser mini-infobar; the banner below replaces it.
      event.preventDefault()
      setDeferred(event as InstallPromptEvent)
    }
    const onInstalled = () => setHidden(true)

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, '1')
    setHidden(true)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    dismiss()
  }

  if (!hydrated || hidden || isStandalone() || isDismissed()) return null
  if (!deferred && !isIOS()) return null

  return (
    <div
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md rounded-2xl border border-night-60 bg-night-80/95 p-3 shadow-[0_8px_28px_-6px_rgba(0,0,0,0.55)] backdrop-blur-sm min-[520px]:inset-x-auto min-[520px]:end-4"
      role="dialog"
      aria-label="تثبيت التطبيق"
    >
      <div className="flex items-start gap-3">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-bold text-mist-100">
            <MdInstallMobile className="shrink-0 text-brand-60" size={17} aria-hidden />
            ثبّت كوزي جيمز على جهازك
          </p>
          {deferred ? (
            <p className="mt-0.5 text-xs text-mist-50">
              تشغيل أسرع بملء الشاشة والعب بدون إنترنت.
            </p>
          ) : (
            <p className="mt-0.5 flex items-start gap-1.5 text-xs leading-5 text-mist-50">
              <MdIosShare className="mt-0.5 shrink-0" size={15} aria-hidden />
              <span>اضغط زر المشاركة في Safari ثم «إضافة إلى الشاشة الرئيسية».</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="إخفاء رسالة التثبيت"
          className="-me-1 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-mist-50 transition hover:bg-night-60 hover:text-mist-100"
        >
          <MdClose size={18} aria-hidden />
        </button>
      </div>

      {deferred && (
        <button
          type="button"
          onClick={install}
          className="mt-3 h-10 w-full rounded-xl bg-brand-100 text-sm font-bold text-mist-100 transition hover:bg-brand-80"
        >
          تثبيت الآن
        </button>
      )}
    </div>
  )
}
