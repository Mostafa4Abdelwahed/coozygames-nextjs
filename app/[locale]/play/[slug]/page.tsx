import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getGameBySlug } from '@/lib/games'
import { auth } from '@/lib/auth'
import { GameStage } from '@/components/game-stage'
import { SubscriptionGate } from '@/components/subscription-gate'
import { getMonthlyPrice, isPremiumActive } from '@/lib/billing'
import { getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { hasLocale } from 'next-intl'

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'Game' })
  const game = getGameBySlug(slug)
  return { title: game ? t('playTitle', { title: game.title }) : 'Coozy Games' }
}

export default async function PlayPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params
  const game = getGameBySlug(slug)
  if (!game) notFound()

  const session = await auth.api.getSession({ headers: await headers() })
  const signedIn = Boolean(session?.user)
  const premiumActive = session?.user ? await isPremiumActive(session.user.id) : false

  if (!premiumActive) {
    const price = await getMonthlyPrice()
    return (
      <SubscriptionGate
        title={game.title}
        signedIn={signedIn}
        price={price}
        backHref={`/game/${game.slug}/`}
      />
    )
  }

  return <GameStage title={game.title} slug={game.slug} playUrl={game.playUrl} backHref={`/game/${game.slug}/`} />
}