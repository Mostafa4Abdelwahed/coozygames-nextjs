'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import { MdVisibility, MdVisibilityOff } from 'react-icons/md'
import { authClient } from '@/lib/auth-client'
import { COUNTRY_CODES, normalizePhoneNumber, validatePhoneNumber } from '@/lib/phone'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function toServerMessage(message: string): string {
  if (message.includes('already exists') || message.includes('already registered'))
    return 'هذا الحساب مسجل بالفعل، سجل الدخول'
  return 'حدث خطأ، حاول مرة أخرى'
}

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [region, setRegion] = useState('EG')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [terms, setTerms] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string; password?: string; terms?: string }>({})
  const [serverError, setServerError] = useState('')
  const [pending, setPending] = useState(false)

  const inputClass =
    'h-12 w-full rounded-xl border border-transparent bg-night-40 px-4 text-start text-base font-bold text-white outline-none placeholder:text-mist-50 focus:border-brand-100'
  const errorInput = 'border-red-500 focus:border-red-500'

  function clearError(key: keyof typeof errors) {
    setErrors((p) => ({ ...p, [key]: undefined }))
    setServerError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (name.trim().length < 2) next.name = 'الاسم يجب أن يكون حرفين على الأقل'
    const phoneError = validatePhoneNumber(phone, region)
    if (phoneError) next.phone = phoneError
    if (!EMAIL_RE.test(email.trim())) next.email = 'البريد الإلكتروني غير صحيح'
    if (password.length < 8) next.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
    if (!terms) next.terms = 'يجب الموافقة على الشروط والأحكام'
    setErrors(next)
    setServerError('')
    if (Object.keys(next).length > 0) return

    const normalizedPhone = normalizePhoneNumber(phone, region)
    if (!normalizedPhone) {
      setErrors({ phone: 'رقم الهاتف غير صحيح، تحقق من الرقم وكود الدولة' })
      setPending(false)
      return
    }
    const fullPhone = normalizedPhone

    setPending(true)
    try {
      const checkRes = await fetch(
        `/api/check-unique?email=${encodeURIComponent(email.trim())}&phoneNumber=${encodeURIComponent(fullPhone)}`,
      )
      const check = (await checkRes.json()) as { emailTaken: boolean; phoneTaken: boolean }
      const taken: typeof errors = {}
      if (check.emailTaken) taken.email = 'هذا البريد مسجل بالفعل، سجل الدخول'
      if (check.phoneTaken) taken.phone = 'هذا الرقم مسجل بالفعل، سجل الدخول'
      if (Object.keys(taken).length > 0) {
        setErrors(taken)
        setPending(false)
        return
      }
    } catch {
      // Pre-check failed (network); the database constraints still guarantee uniqueness
    }

    const { error } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
      phoneNumber: fullPhone,
    })
    setPending(false)
    if (error) {
      const message = error.message ?? ''
      if (message.toLowerCase().includes('phone')) {
        setErrors({ phone: 'هذا الرقم مسجل بالفعل، سجل الدخول' })
      } else if (message.toLowerCase().includes('email')) {
        setErrors({ email: 'هذا البريد مسجل بالفعل، سجل الدخول' })
      } else {
        // Pre-check passed but creation failed: almost certainly a duplicate race
        setServerError('قد يكون هذا الحساب مسجلًا بالفعل، سجل الدخول')
      }
      return
    }
    router.push('/')
    router.refresh()
  }

  async function handleGoogle() {
    setServerError('')
    const { error } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/',
    })
    if (error) setServerError(toServerMessage(error.message ?? ''))
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
      <button
        type="button"
        onClick={handleGoogle}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-night-60 text-sm font-extrabold text-white transition hover:bg-night-40"
      >
        <FcGoogle size={20} />
        المتابعة عبر Google
      </button>

      <div className="flex items-center gap-3 text-xs font-bold text-mist-50">
        <span className="h-px flex-1 bg-night-60" />
        أو
        <span className="h-px flex-1 bg-night-60" />
      </div>

      <div>
        <label htmlFor="register-name" className="mb-1.5 block text-sm font-bold text-white">
          الاسم
        </label>
        <input
          id="register-name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            clearError('name')
          }}
          placeholder="مثال: أحمد محمد"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'register-name-error' : undefined}
          className={`${inputClass} ${errors.name ? errorInput : ''}`}
        />
        {fieldError(errors.name, 'register-name-error')}
      </div>

      <div>
        <label htmlFor="register-phone" className="mb-1.5 block text-sm font-bold text-white">
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
            id="register-phone"
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
            placeholder="1xxxxxxxxx"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'register-phone-error' : undefined}
            className={`${inputClass} text-left ${errors.phone ? errorInput : ''}`}
          />
        </div>
        {fieldError(errors.phone, 'register-phone-error')}
      </div>

      <div>
        <label htmlFor="register-email" className="mb-1.5 block text-sm font-bold text-white">
          البريد الإلكتروني
        </label>
        <input
          id="register-email"
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
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'register-email-error' : undefined}
          className={`${inputClass} text-left ${errors.email ? errorInput : ''}`}
        />
        {fieldError(errors.email, 'register-email-error')}
      </div>

      <div>
        <label htmlFor="register-password" className="mb-1.5 block text-sm font-bold text-white">
          كلمة المرور
        </label>
        <div className="relative">
          <input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              clearError('password')
            }}
            placeholder="8 أحرف على الأقل"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'register-password-error' : undefined}
            className={`${inputClass} pe-12 ${errors.password ? errorInput : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            className="absolute inset-e-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-mist-50 transition hover:text-white"
          >
            {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
          </button>
        </div>
        {fieldError(errors.password, 'register-password-error')}
      </div>

      <div>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-white">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => {
              setTerms(e.target.checked)
              clearError('terms')
            }}
            className="h-4 w-4 accent-brand-100"
          />
          أوافق على الشروط والأحكام
        </label>
        {fieldError(errors.terms, 'register-terms-error')}
      </div>

      {serverError && (
        <p role="alert" className="rounded-xl bg-red-500/15 px-4 py-2.5 text-center text-sm font-bold text-red-400">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 items-center justify-center rounded-[30px] bg-brand-100 text-base font-extrabold text-white transition hover:bg-brand-80 active:opacity-70 disabled:opacity-60"
      >
        {pending ? 'جارٍ إنشاء الحساب...' : 'إنشاء حساب'}
      </button>

      <p className="text-center text-sm font-semibold text-mist-50">
        لديك حساب بالفعل؟{' '}
        <Link href="/login/" className="font-bold text-brand-60 transition hover:text-white">
          تسجيل الدخول
        </Link>
      </p>
    </form>
  )
}
