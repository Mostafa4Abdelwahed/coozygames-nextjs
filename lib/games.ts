import type { IconType } from 'react-icons'
import {
  MdAdjust,
  MdBook,
  MdDirectionsCar,
  MdExtension,
  MdFavorite,
  MdFlashOn,
  MdGridOn,
  MdLanguage,
  MdLightbulb,
  MdMap,
  MdSettings,
  MdSportsSoccer,
  MdStyle,
  MdTouchApp,
  MdVideogameAsset,
} from 'react-icons/md'
import catalog from '@/data/games.json'

export type Game = {
  slug: string
  title: string
  category: string
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
}

const CATEGORY_STYLE: Record<string, { icon: IconType; gradient: string }> = {
  '.io': { icon: MdLanguage, gradient: 'from-fuchsia-500 to-violet-500' },
  Action: { icon: MdFlashOn, gradient: 'from-rose-500 to-amber-400' },
  Adventure: { icon: MdMap, gradient: 'from-purple-500 to-indigo-900' },
  Arcade: { icon: MdVideogameAsset, gradient: 'from-violet-500 to-cyan-400' },
  Beauty: { icon: MdFavorite, gradient: 'from-pink-400 to-rose-500' },
  Board: { icon: MdGridOn, gradient: 'from-stone-400 to-stone-700' },
  Card: { icon: MdStyle, gradient: 'from-indigo-400 to-purple-600' },
  Clicker: { icon: MdTouchApp, gradient: 'from-lime-400 to-emerald-600' },
  Driving: { icon: MdDirectionsCar, gradient: 'from-sky-400 to-indigo-600' },
  Puzzle: { icon: MdExtension, gradient: 'from-amber-400 to-rose-400' },
  Shooting: { icon: MdAdjust, gradient: 'from-slate-500 to-slate-800' },
  Simulation: { icon: MdSettings, gradient: 'from-teal-400 to-emerald-700' },
  Sports: { icon: MdSportsSoccer, gradient: 'from-emerald-400 to-sky-500' },
  Strategy: { icon: MdLightbulb, gradient: 'from-orange-400 to-red-600' },
  Trivia: { icon: MdBook, gradient: 'from-teal-400 to-blue-600' },
  Word: { icon: MdBook, gradient: 'from-yellow-300 to-amber-600' },
}

// Ordered: specific matches first, general last
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

function classify(name: string): string {
  const lower = ` ${name.toLowerCase()} `
  for (const { label, keywords } of CLASSIFIER) {
    if (keywords.some((k) => lower.includes(k))) return label
  }
  return 'Arcade'
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
    const category = classify(raw.name)
    const style = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.Arcade
    const { plays, rating } = pseudoStats(index)
    return {
      slug,
      title: raw.name,
      category,
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

export const TRENDING_GAMES: Game[] = byPlays.slice(0, 8)
export const NEW_GAMES: Game[] = ALL_GAMES.slice(400, 408)
export const ACTION_GAMES: Game[] = ALL_GAMES.filter((g) => g.category === 'Action').slice(0, 6)
export const PUZZLE_GAMES: Game[] = ALL_GAMES.filter((g) => g.category === 'Puzzle').slice(0, 6)

const SLUG_TO_LABEL: Record<string, string> = {
  io: '.io',
}

export function getGamesByCategory(slug: string): Game[] {
  const label = SLUG_TO_LABEL[slug] ?? slug
  return ALL_GAMES.filter((g) => g.category.toLowerCase() === label.toLowerCase())
}

export function getGameBySlug(slug: string): Game | undefined {
  return ALL_GAMES.find((g) => g.slug === slug)
}
