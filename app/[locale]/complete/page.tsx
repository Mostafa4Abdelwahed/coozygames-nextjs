import Link from 'next/link'
import type { Metadata } from 'next'
import type { ComponentType } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { MdChevronLeft, MdHome, MdLinkOff, MdPersonAdd, MdSchedule, MdWorkspacePremium } from 'react-icons/md'
import { auth } from '@/lib/auth'
import { getProfileGaps } from '@/lib/profile'
import { resolveAccessLink, type AccessLink } from '@/lib/access-links'
import { CompleteProfileForm } from '@/components/complete-profile-form'
import { ActivateLinkCard } from '@/components/access-link/activate-card'
import { getTranslations } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'Metadata' })
  return { title: t('completeTitle') }
}

type SearchParams = { token?: string }
type Translator = Awaited<ReturnType<typeof getTranslations>>;

function StatusCard({
  title,
  text,
  icon: Icon,
  homeLabel,
}: {
  title: string
  text: string
  icon: ComponentType<{ size?: number; className?: string }>
  homeLabel: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-night-60 bg-night-80 p-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-night-60 text-mist-50">
        <Icon size={32} />
      </span>
      <h1 className="text-xl font-extrabold text-white sm:text-2xl">{title}</h1>
      <p className="max-w-sm text-sm font-semibold text-mist-50">{text}</p>
      <Link
        href="/"
        className="mt-1 flex h-12 w-full items-center justify-center rounded-[30px] bg-night-60 text-base font-extrabold text-white transition hover:bg-night-40 sm:w-64"
      >
        {homeLabel}
      </Link>
    </div>
  )
}

function SignInGate({ subscriptionDays, next, t }: { subscriptionDays: number; next: string; t: Translator }) {
  return (
    <div className="rounded-2xl border border-night-60 bg-night-80 p-5 sm:p-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-night-60 text-brand-60">
          <MdWorkspacePremium size={24} />
        </span>
        <div>
          <h1 className="text-xl font-extrabold text-white sm:text-2xl">{t('subscriptionOffer')}</h1>
          <p className="mt-0.5 text-sm font-semibold text-mist-50">{t('enjoyDays', { days: subscriptionDays })}</p>
        </div>
      </div>
      <p className="mb-5 text-sm font-semibold text-mist-50">{t('signInOrCreate')}</p>
      <div className="flex flex-col gap-3">
        <Link
          href={`/login/?next=${encodeURIComponent(next)}`}
          className="flex h-12 w-full items-center justify-center rounded-[30px] bg-brand-100 text-base font-extrabold text-white transition hover:bg-brand-80 active:opacity-70"
        >
          {t('login')}
        </Link>
        <Link
          href={`/register/?next=${encodeURIComponent(next)}`}
          className="flex h-12 w-full items-center justify-center rounded-[30px] bg-night-60 text-base font-extrabold text-white transition hover:bg-night-40 active:opacity-70"
        >
          {t('register')}
        </Link>
      </div>
    </div>
  )
}

function ActiveLinkFlow({
  link,
  token,
  session,
  t,
}: {
  link: AccessLink
  token: string
  session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>['user']
  t: Translator
}) {
  const gaps = getProfileGaps(session)

  if (gaps.length > 0) {
    return (
      <div className="rounded-2xl border border-night-60 bg-night-80 p-5 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-night-60 text-brand-60">
            <MdPersonAdd size={24} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-white sm:text-2xl">{t('confirmDataFirst')}</h1>
            <p className="mt-0.5 text-sm font-semibold text-mist-50">
              {t('missingForActivation', { fields: gaps.map((g) => t(`field.${g}`)).join('، ') })}
            </p>
          </div>
        </div>
        <CompleteProfileForm
          missing={gaps}
          currentName={session.name ?? ''}
          redirectTo={`/complete/?token=${encodeURIComponent(token)}`}
        />
      </div>
    )
  }

  return <ActivateLinkCard token={token} subscriptionDays={link.subscriptionDays} />
}

export default async function CompletePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<SearchParams>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'Auth' })
  const tCommon = await getTranslations({ locale, namespace: 'Common' })

  const sp = await searchParams
  const token = String(sp.token ?? '').trim()
  const session = await auth.api.getSession({ headers: await headers() })

  // No token → the classic "finish your profile" page.
  if (!token) {
    if (!session) {
      redirect('/login/')
    }
    const gaps = getProfileGaps(session.user)
    if (gaps.length === 0) {
      redirect('/profile/')
    }
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-3 sm:gap-8 sm:p-5">
        <nav aria-label={tCommon('breadcrumb')} className="flex items-center gap-1 text-sm font-semibold text-mist-50">
          <Link href="/" className="flex items-center gap-1 transition hover:text-white">
            <MdHome size={16} />
            {tCommon('home')}
          </Link>
          <MdChevronLeft size={16} />
          <span className="text-white">{t('completeProfile')}</span>
        </nav>
        <div className="rounded-2xl border border-night-60 bg-night-80 p-5 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-night-60 text-brand-60">
              <MdPersonAdd size={24} />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-white sm:text-2xl">{t('completeProfile')}</h1>
              <p className="mt-0.5 text-sm font-semibold text-mist-50">
                {t('missingFields', { fields: gaps.map((g) => t(`field.${g}`)).join('، ') })}
              </p>
            </div>
          </div>
          <CompleteProfileForm missing={gaps} currentName={session.user.name ?? ''} />
        </div>
      </div>
    )
  }

  const link = await resolveAccessLink(token)

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-3 sm:gap-8 sm:p-5">
      <nav aria-label={tCommon('breadcrumb')} className="flex items-center gap-1 text-sm font-semibold text-mist-50">
        <Link href="/" className="flex items-center gap-1 transition hover:text-white">
          <MdHome size={16} />
          {tCommon('home')}
        </Link>
        <MdChevronLeft size={16} />
        <span className="text-white">{t('activateSubscription')}</span>
      </nav>

      {!link && <StatusCard title={t('linkInvalid')} text={t('linkInvalidDesc')} icon={MdLinkOff} homeLabel={tCommon('home')} />}
      {link?.status === 'used' && (
        <StatusCard title={t('linkUsed')} text={t('linkUsedDesc')} icon={MdLinkOff} homeLabel={tCommon('home')} />
      )}
      {link?.status === 'expired' && (
        <StatusCard title={t('linkExpired')} text={t('linkExpiredDesc')} icon={MdSchedule} homeLabel={tCommon('home')} />
      )}

      {link && link.status === 'active' && !session && (
        <SignInGate subscriptionDays={link.subscriptionDays} next={`/complete/?token=${encodeURIComponent(token)}`} t={t} />
      )}

      {link?.status === 'active' && session && <ActiveLinkFlow link={link} token={token} session={session.user} t={t} />}
    </div>
  )
}