import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getGameBySlug } from '@/lib/games'
import { GameStage } from '@/components/game-stage'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const game = getGameBySlug(slug)
  return { title: game ? `العب ${game.title} | Coozy Games` : 'Coozy Games' }
}

export default async function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const game = getGameBySlug(slug)
  if (!game) notFound()

  return <GameStage title={game.title} playUrl={game.playUrl} backHref={`/game/${game.slug}/`} />
}
