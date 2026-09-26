import type { IconType } from 'react-icons'
import { categoryStyle } from './category-meta'
import catalog from '@/data/games.json'

export type GameCategory = {
  slug: string
  label: string
}

export type Game = {
  slug: string
  title: string
  /** Primary category label (first entry of `categories`) */
  category: string
  /** Primary category slug */
  categorySlug: string
  /** All real categories from the catalog (primary first) */
  categories: GameCategory[]
  plays: string
  rating: number
  icon: IconType
  gradient: string
  /** Local cached thumbnail, e.g. `/image/<hash>/<file>` */
  thumb?: string
  /** Real playable game URL (proxied at play time) */
  playUrl?: string
}

type RawGame = {
  name: string
  image: string
  url: string
  categories?: GameCategory[]
}

// Fallback classifier used only when a catalog entry has no categories.
const CLASSIFIER: { label: string; keywords: string[] }[] = [
  { label: '.io', keywords: ['.io', 'agar', 'slither', 'surviv', 'snake', 'worm', 'arena'] },
  { label: 'Word', keywords: ['word', 'crossword', 'letter', 'typing', 'spelling', 'wordle'] },
  { label: 'Trivia', keywords: ['trivia', 'quiz', 'guess the', 'who is', 'riddle'] },
  { label: 'Card', keywords: ['card', 'poker', 'solitaire', 'uno', 'blackjack'] },
  { label: 'Board', keywords: ['chess', 'checkers', 'ludo', 'mahjong', 'domino', 'backgammon'] },
  { label: 'Clicker', keywords: ['clicker', 'idle', 'click '] },
  { label: 'Driving', keywords: ['race', 'racing', 'drive', 'driving', 'drift', 'parking', 'truck', 'moto', 'bike', 'traffic', 'kart'] },
  { label: 'Shooting', keywords: ['shoot', 'sniper', 'gun', 'zombie', 'archer', 'archery', 'tank', 'bullet', 'strike'] },
  { label: 'Sports', keywords: ['soccer', 'football', 'basketball', 'tennis', 'golf', 'baseball', 'cricket', 'hockey', 'boxing', 'wrestling', 'skate', 'surfing', 'pool', 'billiard', 'bowling', 'fishing', 'ski', 'cycling', 'wrestle'] },
  { label: 'Simulation', keywords: ['simulator', 'tycoon', 'farm', 'cooking', 'cook', 'restaurant', 'hospital', 'airport', 'doctor', 'dentist', 'pet', 'baby'] },
  { label: 'Beauty', keywords: ['beauty', 'dress', 'makeup', 'fashion', 'hair', 'nail', 'princess', 'wedding', 'barbie'] },
  { label: 'Strategy', keywords: ['strategy', 'tower', 'defense', 'empire', 'kingdom', 'civilization', 'tactics'] },
  { label: 'Puzzle', keywords: ['puzzle', 'block', 'match', 'merge', 'jewel', 'candy', 'sudoku', 'maze', 'brain', '2048', 'jigsaw', 'bubble', 'tetris'] },
  { label: 'Shooting', keywords: ['war ', 'battlefield'] },
  { label: 'Action', keywords: ['action', 'fight', 'fighter', 'battle', 'warrior', 'stickman', 'samurai', 'dragon', 'ninja', 'assassin', 'hero'] },
  { label: 'Adventure', keywords: ['adventure', 'quest', 'journey', 'island', 'pirate', 'treasure', 'escape', 'temple'] },
  { label: 'Arcade', keywords: ['arcade', 'runner', 'dash', 'stack', 'pong'] },
]

function classify(name: string): GameCategory {
  const lower = ` ${name.toLowerCase()} `
  for (const { label, keywords } of CLASSIFIER) {
    if (keywords.some((k) => lower.includes(k))) {
      const slug = label === '.io' ? 'io' : label.toLowerCase()
      return { slug, label }
    }
  }
  return { slug: 'arcade', label: 'Arcade' }
}

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'game'
}

function pseudoStats(index: number): { plays: string; rating: number } {
  const playsNum = 0.3 + ((index * 7919) % 8500) / 1000
  const plays = playsNum >= 1 ? `${playsNum.toFixed(1)}M` : `${Math.round(playsNum * 1000)}K`
  const rating = 4 + ((index * 13) % 9) / 10
  return { plays, rating: Math.round(rating * 10) / 10 }
}

function buildGames(): Game[] {
  const seen = new Map<string, number>()
  return (catalog as RawGame[]).map((raw, index) => {
    const base = slugify(raw.name)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    const slug = count === 0 ? base : `${base}-${count + 1}`
    const categories = raw.categories?.length ? raw.categories : [classify(raw.name)]
    const primary = categories[0]
    const style = categoryStyle(primary.slug)
    const { plays, rating } = pseudoStats(index)
    return {
      slug,
      title: raw.name,
      category: primary.label,
      categorySlug: primary.slug,
      categories,
      plays,
      rating,
      icon: style.icon,
      gradient: style.gradient,
      thumb: `/image/${raw.image}`,
      playUrl: raw.url,
    }
  })
}

export const ALL_GAMES: Game[] = buildGames()

const byPlays = [...ALL_GAMES].sort((a, b) => {
  const num = (p: string) => (p.endsWith('M') ? parseFloat(p) * 1000 : parseFloat(p))
  return num(b.plays) - num(a.plays)
})

export const TRENDING_GAMES: Game[] = byPlays.slice(0, 12)
export const TRENDING_ALL: Game[] = byPlays
export const NEW_ALL: Game[] = [...ALL_GAMES].reverse()
export const NEW_GAMES: Game[] = ALL_GAMES.slice(400, 412)
export const ACTION_GAMES: Game[] = ALL_GAMES.filter((g) => g.categorySlug === 'action').slice(0, 6)
export const PUZZLE_GAMES: Game[] = ALL_GAMES.filter((g) => g.categorySlug === 'puzzle').slice(0, 6)

// O(1) lookups: the catalog is scanned dozens of times per static page, so
// precompute slug + category indexes once at module load.
const GAME_BY_SLUG = new Map<string, Game>(ALL_GAMES.map((g) => [g.slug, g]))

const GAMES_BY_CATEGORY = new Map<string, Game[]>()
for (const game of ALL_GAMES) {
  for (const { slug } of game.categories) {
    const list = GAMES_BY_CATEGORY.get(slug)
    if (list) list.push(game)
    else GAMES_BY_CATEGORY.set(slug, [game])
  }
}

export function getGamesByCategory(slug: string): Game[] {
  return GAMES_BY_CATEGORY.get(resolveCategorySlug(slug)) ?? []
}

/** Legacy slugs from the old hardcoded list that no longer exist in data. */
const LEGACY_ALIASES: Record<string, string> = {
  word: 'words',
}

export const LEGACY_CATEGORY_SLUGS: string[] = Object.keys(LEGACY_ALIASES)

/** Resolves old/renamed slugs to current ones. */
export function resolveCategorySlug(slug: string): string {
  return LEGACY_ALIASES[slug] ?? slug
}

export function getGameBySlug(slug: string): Game | undefined {
  return GAME_BY_SLUG.get(slug)
}

/** All game slugs (for static generation of /game/[slug]). */
export function allGameSlugs(): string[] {
  return ALL_GAMES.map((g) => g.slug)
}
