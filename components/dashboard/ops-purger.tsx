'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MdDeleteSweep, MdWarning } from 'react-icons/md'
import { formatBytes } from '@/lib/dashboard/bytes'

type Result = { done: boolean; error?: string; deleted?: number; freedBytes?: number; errors?: string[] }

export function OpsPurger() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<Result>({ done: false })

  async function run() {
    if (!checked || running) return
    setRunning(true)
    setResult({ done: false })
    try {
      const res = await fetch('/api/admin/ops/purge-cache', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
      const data = (await res.json().catch(() => null)) as Partial<Result> | null
      if (!res.ok) {
        setResult({ done: true, error: data?.error ?? 'فشل التنظيف' })
      } else {
        setResult({ done: true, deleted: data?.deleted ?? 0, freedBytes: data?.freedBytes ?? 0, errors: data?.errors })
        router.refresh()
      }
    } catch {
      setResult({ done: true, error: 'تعذر الاتصال بالخادم' })
    }
    setRunning(false)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void run()
      }}
      className="flex flex-col gap-3 rounded-2xl border border-night-60 bg-night-80 p-4"
    >
      <div className="flex items-center gap-2">
        <MdWarning size={20} className="text-amber-400" />
        <h2 className="text-base font-extrabold text-white">تنظيف كاش الصور</h2>
      </div>
      <p className="text-sm font-semibold text-mist-50">
        يحذف نسخ التحويل المشتقّة (variants) الأقدم من ساعة واحدة فقط — الأصلية لا تُمسّ،
        والنسخ المحذوفة تُعاد إنشاؤها تلقائيًا عند الحاجة.
      </p>
      <label className="flex items-center gap-2 text-sm font-bold text-mist-50">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="h-4 w-4 accent-brand-100"
        />
        أفهم: هذا يحرر مساحة وقد يعيد تحميل بعض الصور لاحقًا
      </label>

      {result.done &&
        (result.error ? (
          <p className="text-xs font-bold text-red-400">{result.error}</p>
        ) : (
          <p className="text-xs font-bold text-emerald-400">
            تم التنظيف: حُذف {result.deleted?.toLocaleString('en-US') ?? 0} ملف
            {result.deleted ? ` (${formatBytes(result.freedBytes ?? 0)})` : ''}
            {result.errors && result.errors.length > 0 ? ` — فشل ${result.errors.length}` : ''}
          </p>
        ))}

      <button
        type="submit"
        disabled={!checked || running}
        className="flex h-10 items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 text-sm font-extrabold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <MdDeleteSweep size={18} />
        {running ? 'جارٍ التنظيف...' : 'تنفيذ التنظيف'}
      </button>
    </form>
  )
}