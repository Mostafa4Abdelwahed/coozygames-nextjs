import Link from 'next/link'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { MdChevronLeft, MdHome } from 'react-icons/md'
import { auth } from '@/lib/auth'
import { LoginForm } from '@/components/login-form'

export const metadata: Metadata = {
  title: 'تسجيل الدخول | Coozy Games',
}

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect('/profile/')
  }
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-3 sm:gap-8 sm:p-5">
      <nav aria-label="مسار التنقل" className="flex items-center gap-1 text-sm font-semibold text-mist-50">
        <Link href="/" className="flex items-center gap-1 transition hover:text-white">
          <MdHome size={16} />
          الرئيسية
        </Link>
        <MdChevronLeft size={16} />
        <span className="text-white">تسجيل الدخول</span>
      </nav>

      <div className="rounded-2xl border border-night-60 bg-night-80 p-5 sm:p-8">
        <h1 className="text-xl font-extrabold text-white sm:text-2xl">تسجيل الدخول</h1>
        <p className="mt-1 mb-6 text-sm font-semibold text-mist-50">مرحبًا بعودتك! سجل الدخول لمواصلة اللعب.</p>
        <LoginForm />
      </div>
    </div>
  )
}
