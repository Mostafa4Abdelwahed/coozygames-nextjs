'use client'

import { useActionState } from 'react'
import { MdEdit, MdRestartAlt } from 'react-icons/md'
import {
  clearGameOverride,
  upsertGameOverride,
  type OverrideState,
} from '@/app/dashboard/games/actions'
import type { GameOverride } from '@/lib/dashboard/overrides'

export type OverrideInitial = Pick<GameOverride, 'hidden' | 'featured' | 'sortWeight' | 'titleAr' | 'thumb'>

const initState: OverrideState = { done: false }

function ErrorMessage({ state }: { state: OverrideState }) {
  if (!state.error) return null
  return <p className="text-xs font-bold text-red-400">{state.error}</p>
}

export function GameOverrideForm({ slug, initial }: { slug: string; initial: OverrideInitial }) {
  const [state, formAction, saving] = useActionState(upsertGameOverride, initState)
  const [clearState, clearAction, clearing] = useActionState(clearGameOverride, initState)

  return (
    <details className="rounded-xl border border-night-60 bg-night-100">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-extrabold text-brand-60 transition hover:text-white">
        <MdEdit size={16} />
        تعديل العرض
      </summary>

      <div className="flex flex-col gap-3 p-3">
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="slug" value={slug} />

          <label className="flex items-center gap-2 text-sm font-bold text-mist-50">
            <input
              type="checkbox"
              name="hidden"
              defaultChecked={initial.hidden}
              className="h-4 w-4 accent-brand-100"
            />
            إخفاء اللعبة
          </label>

          <label className="flex items-center gap-2 text-sm font-bold text-mist-50">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={initial.featured}
              className="h-4 w-4 accent-brand-100"
            />
            تمييز (أول القائمة)
          </label>

          <div className="flex flex-col gap-1">
            <label htmlFor={`weight-${slug}`} className="text-xs font-bold text-mist-50">
              وزن الترتيب (تنازلي)
            </label>
            <input
              id={`weight-${slug}`}
              type="number"
              name="sortWeight"
              defaultValue={initial.sortWeight}
              className="h-9 rounded-lg border border-night-60 bg-night-80 px-2 text-sm font-semibold text-white outline-none focus:border-brand-60"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`title-${slug}`} className="text-xs font-bold text-mist-50">
              عنوان عربي
            </label>
            <input
              id={`title-${slug}`}
              type="text"
              name="titleAr"
              defaultValue={initial.titleAr ?? ''}
              placeholder="يُترك فارغًا لاستخدام العنوان الأصلي"
              className="h-9 rounded-lg border border-night-60 bg-night-80 px-2 text-sm font-semibold text-white outline-none placeholder:text-mist-30 focus:border-brand-60"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={`thumb-${slug}`} className="text-xs font-bold text-mist-50">
              صورة مصغّرة (تبدأ بـ /image/)
            </label>
            <input
              id={`thumb-${slug}`}
              type="text"
              name="thumb"
              defaultValue={initial.thumb ?? ''}
              placeholder="/image/..."
              dir="ltr"
              className="h-9 rounded-lg border border-night-60 bg-night-80 px-2 text-sm font-semibold text-white outline-none placeholder:text-mist-30 focus:border-brand-60"
            />
          </div>

          <ErrorMessage state={state} />
          <button
            type="submit"
            disabled={saving}
            className="h-9 rounded-lg bg-brand-100 px-4 text-sm font-extrabold text-white transition hover:bg-brand-80 disabled:opacity-50"
          >
            {saving ? 'جارٍ الحفظ...' : 'حفظ'}
          </button>
        </form>

        <form action={clearAction} className="border-t border-night-60 pt-3">
          <input type="hidden" name="slug" value={slug} />
          <ErrorMessage state={clearState} />
          <button
            type="submit"
            disabled={clearing}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-night-60 px-4 text-sm font-extrabold text-mist-50 transition hover:border-red-500/50 hover:text-red-400 disabled:opacity-50"
          >
            <MdRestartAlt size={16} />
            {clearing ? 'جارٍ الإزالة...' : 'إعادة تعيين (حذف الـ override)'}
          </button>
        </form>
      </div>
    </details>
  )
}