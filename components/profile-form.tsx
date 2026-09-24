'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

export function ProfileForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim().length < 2) {
      setError('الاسم يجب أن يكون حرفين على الأقل')
      setDone(false)
      return
    }
    setError('')
    setPending(true)
    const { error } = await authClient.updateUser({ name: name.trim() })
    setPending(false)
    if (error) {
      setError('حدث خطأ، حاول مرة أخرى')
      setDone(false)
      return
    }
    setDone(true)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-4">
      <div>
        <label htmlFor="profile-name" className="mb-1.5 block text-sm font-bold text-white">
          الاسم
        </label>
        <input
          id="profile-name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
            setDone(false)
          }}
          aria-invalid={error !== ''}
          aria-describedby={error ? 'profile-name-error' : undefined}
          className={`h-12 w-full rounded-xl border border-transparent bg-night-40 px-4 text-start text-base font-bold text-white outline-none placeholder:text-mist-50 focus:border-brand-100 ${error ? 'border-red-500 focus:border-red-500' : ''}`}
        />
        {error && (
          <p id="profile-name-error" role="alert" className="mt-1.5 text-xs font-bold text-red-400">
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 items-center justify-center rounded-[30px] bg-brand-100 text-base font-extrabold text-white transition hover:bg-brand-80 active:opacity-70 disabled:opacity-60"
      >
        {pending ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
      </button>

      {done && (
        <p role="status" className="rounded-xl bg-emerald-500/15 px-4 py-2.5 text-center text-sm font-bold text-emerald-400">
          تم حفظ التعديلات بنجاح
        </p>
      )}
    </form>
  )
}
