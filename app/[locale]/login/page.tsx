import Link from 'next/link'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { MdChevronLeft, MdHome } from 'react-icons/md'
import { auth } from '@/lib/auth'
import { safePath } from '@/lib/navigation'
import { LoginForm } from '@/components/login-form'
import { getTranslations } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'Metadata' })
  return { title: t('loginTitle') }
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'Auth' })

  const session = await auth.api.getSession({
    headers: await headers(),
  })
  const next = await searchParams.then((sp) => safePath(sp.next, '/profile/'))

  if (session) {
    redirect(next)
  }
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-3 sm:gap-8 sm:p-5">
      <nav aria-label={t('breadcrumb')} className="flex items-center gap-1 text-sm font-semibold text-mist-50">
        <Link href="/" className="flex items-center gap-1 transition hover:text-white">
          <MdHome size={16} />
          {t('home')}
        </Link>
        <MdChevronLeft size={16} />
        <span className="text-white">{t('loginTitle')}</span>
      </nav>

      <div className="rounded-2xl border border-night-60 bg-night-80 p-5 sm:p-8">
        <h1 className="text-xl font-extrabold text-white sm:text-2xl">{t('loginTitle')}</h1>
        <p className="mt-1 mb-6 text-sm font-semibold text-mist-50">{t('loginDesc')}</p>
        <LoginForm next={next} />
      </div>
    </div>
  )
}