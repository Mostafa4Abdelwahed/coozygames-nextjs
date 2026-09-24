'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { MdCalendarMonth, MdLink, MdWorkspacePremium } from 'react-icons/md'
import { redeemLink, type RedeemLinkState } from '@/app/complete/actions'
import { formatDateAr } from '@/lib/money'

const initState: RedeemLinkState = { done: false }

export function ActivateLinkCard({ token, subscriptionDays }: { token: string; subscriptionDays: number }) {
  const [state, formAction, pending] = useActionState(redeemLink, initState)

  const success = state.done && !state.error && state.expiresAt

  return (
    <div className="rounded-2xl border border-night-60 bg-night-80 p-5 sm:p-8">
      {success ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
            <MdWorkspacePremium size={32} />
          </span>
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">اشتراكك مُفعّل!</h2>
          <p className="text-sm font-semibold text-mist-50">تم منحك {subscriptionDays} يوم لعب بدون حدود.</p>
          <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-400">
            <MdCalendarMonth size={18} />
            اشتراكك النشط ينتهي في {formatDateAr(state.expiresAt)}
          </p>
          <Link
            href="/games/"
            className="mt-1 flex h-12 w-full items-center justify-center rounded-[30px] bg-brand-100 text-base font-extrabold text-white transition hover:bg-brand-80 active:opacity-70 sm:w-64"
          >
            ابدأ اللعب الآن
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-night-60 text-brand-60">
              <MdWorkspacePremium size={24} />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-white sm:text-2xl">رابط اشتراك مميز</h1>
              <p className="mt-0.5 text-sm font-semibold text-mist-50">ليك {subscriptionDays} يوم لعب بدون حدود</p>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-night-60 bg-night-40 px-4 py-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-mist-50">
                <MdLink size={14} />
                المدة
              </span>
              <span className="mt-1 block text-lg font-extrabold text-white">{subscriptionDays} يوم</span>
            </div>
            <div className="rounded-xl border border-night-60 bg-night-40 px-4 py-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-mist-50">
                <MdWorkspacePremium size={14} />
                الاستخدام
              </span>
              <span className="mt-1 block text-lg font-extrabold text-white">مرة واحدة فقط</span>
            </div>
          </div>

          {state.done && state.error && (
            <p
              role="alert"
              className="rounded-xl bg-red-500/15 px-4 py-2.5 text-center text-sm font-bold text-red-400"
            >
              {state.error}
            </p>
          )}

          <form action={formAction}>
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              disabled={pending}
              className="flex h-12 w-full items-center justify-center rounded-[30px] bg-brand-100 text-base font-extrabold text-white transition hover:bg-brand-80 active:opacity-70 disabled:opacity-60"
            >
              {pending ? 'جارٍ التفعيل...' : 'تفعيل الاشتراك'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}