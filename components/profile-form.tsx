'use client'

import { useState } from 'react'
import { COUNTRY_CODES, validatePhoneNumber } from '@/lib/phone'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function ProfileForm() {
  const [name, setName] = useState('لاعب كوزي')
  const [region, setRegion] = useState('EG')
  const [phone, setPhone] = useState('1001234567')
  const [email, setEmail] = useState('player@coozygames.com')
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({})
  const [done, setDone] = useState(false)

  const inputClass =
    'h-12 w-full rounded-xl border border-transparent bg-night-40 px-4 text-start text-base font-bold text-white outline-none placeholder:text-mist-50 focus:border-brand-100'
  const errorInput = 'border-red-500 focus:border-red-500'

  function clearError(key: keyof typeof errors) {
    setErrors((p) => ({ ...p, [key]: undefined }))
    setDone(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (name.trim().length < 2) next.name = 'الاسم يجب أن يكون حرفين على الأقل'
    const phoneError = validatePhoneNumber(phone, region)
    if (phoneError) next.phone = phoneError
    if (!EMAIL_RE.test(email.trim())) next.email = 'البريد الإلكتروني غير صحيح'
    setErrors(next)
    setDone(Object.keys(next).length === 0)
  }

  function fieldError(message?: string, id?: string) {
    if (!message) return null
    return (
      <p id={id} role="alert" className="mt-1.5 text-xs font-bold text-red-400">
        {message}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-4">
      <h2 className="text-lg font-extrabold text-white">تعديل البيانات</h2>

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
            clearError('name')
          }}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'profile-name-error' : undefined}
          className={`${inputClass} ${errors.name ? errorInput : ''}`}
        />
        {fieldError(errors.name, 'profile-name-error')}
      </div>

      <div>
        <label htmlFor="profile-phone" className="mb-1.5 block text-sm font-bold text-white">
          رقم الهاتف
        </label>
        <div className="flex gap-2" dir="ltr">
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value)
              clearError('phone')
            }}
            aria-label="كود الدولة"
            className="h-12 w-28 shrink-0 rounded-xl border border-transparent bg-night-40 px-2 text-left text-sm font-bold text-white outline-none focus:border-brand-100"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code} className="bg-night-80">
                {c.code} {c.dial}
              </option>
            ))}
          </select>
          <input
            id="profile-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              clearError('phone')
            }}
            onBlur={() => {
              if (phone) {
                const message = validatePhoneNumber(phone, region)
                if (message) setErrors((p) => ({ ...p, phone: message }))
              }
            }}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'profile-phone-error' : undefined}
            className={`${inputClass} text-left ${errors.phone ? errorInput : ''}`}
          />
        </div>
        {fieldError(errors.phone, 'profile-phone-error')}
      </div>

      <div>
        <label htmlFor="profile-email" className="mb-1.5 block text-sm font-bold text-white">
          البريد الإلكتروني
        </label>
        <input
          id="profile-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            clearError('email')
          }}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'profile-email-error' : undefined}
          className={`${inputClass} text-left ${errors.email ? errorInput : ''}`}
        />
        {fieldError(errors.email, 'profile-email-error')}
      </div>

      <button
        type="submit"
        className="flex h-12 items-center justify-center rounded-[30px] bg-brand-100 text-base font-extrabold text-white transition hover:bg-brand-80 active:opacity-70"
      >
        حفظ التعديلات
      </button>

      {done && (
        <p role="status" className="rounded-xl bg-emerald-500/15 px-4 py-2.5 text-center text-sm font-bold text-emerald-400">
          تم حفظ التعديلات بنجاح (وضع تجريبي)
        </p>
      )}
    </form>
  )
}
