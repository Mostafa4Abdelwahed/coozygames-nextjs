import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getGameBySlug } from '@/lib/games'
import { auth } from '@/lib/auth'
import { GameStage } from '@/components/game-stage'
import { SubscriptionGate } from '@/components/subscription-gate'
import { getMonthlyPrice, isPremiumActive } from '@/lib/billing'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const game = getGameBySlug(slug)
  return { title: game ? `العب ${game.title} | Coozy Games` : 'Coozy Games' }
}

export default async function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
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