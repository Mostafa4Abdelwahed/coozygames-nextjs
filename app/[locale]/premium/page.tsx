import { MdChevronLeft, MdHome, MdWorkspacePremium } from 'react-icons/md'
import { headers } from 'next/headers'
import Link from 'next/link'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { getMonthlyPrice, getSubscriptionState, listPaymentMethods, formatMoney } from '@/lib/billing'
import { PremiumPanel } from '@/components/premium-panel'
import { PremiumHistory } from '@/components/premium-history'
import { getTranslations } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

const df = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })

function formatDate(d: Date | null): string {
  return d ? df.format(d) : ''
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'Metadata' })
  return { title: t('premiumTitle') }
}

export default async function PremiumPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'Premium' })
  const tCommon = await getTranslations({ locale, namespace: 'Common' })

  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user.id ?? ''
  const [price, methods, state] = await Promise.all([
    getMonthlyPrice(),
    listPaymentMethods(false),
    userId ? getSubscriptionState(userId) : Promise.resolve(null),
  ])

  const priceLabel = formatMoney(price, 'EGP')

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-3 sm:gap-8 sm:p-5">
      <nav aria-label={tCommon('breadcrumb')} className="flex items-center gap-1 text-sm font-semibold text-mist-50">
        <Link href="/" className="flex items-center gap-1 transition hover:text-white">
          <MdHome size={16} />
          {tCommon('home')}
        </Link>
        <MdChevronLeft size={16} />
        <span className="text-white">{t('title')}</span>
      </nav>

      <div className="flex flex-col gap-4 rounded-2xl border border-night-60 bg-night-80 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6842ff,#22d3ee)] text-white sm:h-20 sm:w-20">
          <MdWorkspacePremium size={36} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold text-white sm:text-2xl">
            {t('title')} {state?.active ? `— ${t('activeLabel')}` : ''}
          </h1>
          <p className="mt-1 text-sm font-semibold text-mist-50">
            {state?.active
              ? t('activeUntilDate', { date: formatDate(state.expiresAt), days: state.daysLeft, plural: state.daysLeft === 1 ? '' : 's' })
              : state?.pendingPaymentCount
                ? t('pendingReview')
                : t('subscribeAt', { price: priceLabel })}
          </p>
        </div>
        <div className="shrink-0 rounded-2xl border border-brand-100/50 bg-[linear-gradient(135deg,rgba(104,66,255,.18),rgba(34,211,238,.18))] px-5 py-2.5 text-center sm:px-7">
          <span className="block text-xs font-bold text-mist-50">{t('monthlyPrice')}</span>
          <span className="block text-2xl font-extrabold text-white sm:text-3xl">{priceLabel}</span>
        </div>
      </div>

      <PremiumPanel
        price={price}
        priceLabel={priceLabel}
        methods={methods}
        hasActive={Boolean(state?.active)}
        hasPending={Boolean(state?.pendingPaymentCount)}
      />

      <PremiumHistory userId={userId} title={t('subscriptionHistory')} locale={locale} />
    </div>
  )
}