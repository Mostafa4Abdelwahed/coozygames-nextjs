import type { IconType } from 'react-icons'
import {
  MdAdjust,
  MdBook,
  MdDirectionsCar,
  MdExtension,
  MdFavorite,
  MdFlashOn,
  MdGridOn,
  MdGroup,
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

const FALLBACK_STYLE = { icon: MdVideogameAsset, gradient: 'from-violet-500 to-cyan-400' }

const CATEGORY_STYLE: Record<string, { icon: IconType; gradient: string }> = {
  io: { icon: MdLanguage, gradient: 'from-fuchsia-500 to-violet-500' },
  action: { icon: MdFlashOn, gradient: 'from-rose-500 to-amber-400' },
  adventure: { icon: MdMap, gradient: 'from-purple-500 to-indigo-900' },
  arcade: { icon: MdVideogameAsset, gradient: 'from-violet-500 to-cyan-400' },
  beauty: { icon: MdFavorite, gradient: 'from-pink-400 to-rose-500' },
  'dress-up': { icon: MdFavorite, gradient: 'from-pink-400 to-rose-500' },
  girls: { icon: MdFavorite, gradient: 'from-pink-400 to-rose-500' },
  board: { icon: MdGridOn, gradient: 'from-stone-400 to-stone-700' },
  mahjong: { icon: MdGridOn, gradient: 'from-stone-400 to-stone-700' },
  card: { icon: MdStyle, gradient: 'from-indigo-400 to-purple-600' },
  cards: { icon: MdStyle, gradient: 'from-indigo-400 to-purple-600' },
  clicker: { icon: MdTouchApp, gradient: 'from-lime-400 to-emerald-600' },
  idle: { icon: MdTouchApp, gradient: 'from-lime-400 to-emerald-600' },
  driving: { icon: MdDirectionsCar, gradient: 'from-sky-400 to-indigo-600' },
  car: { icon: MdDirectionsCar, gradient: 'from-sky-400 to-indigo-600' },
  racing: { icon: MdDirectionsCar, gradient: 'from-sky-400 to-indigo-600' },
  moto: { icon: MdDirectionsCar, gradient: 'from-sky-400 to-indigo-600' },
  parking: { icon: MdDirectionsCar, gradient: 'from-sky-400 to-indigo-600' },
  puzzle: { icon: MdExtension, gradient: 'from-amber-400 to-rose-400' },
  merge: { icon: MdExtension, gradient: 'from-amber-400 to-rose-400' },
  brain: { icon: MdLightbulb, gradient: 'from-amber-300 to-orange-500' },
  shooting: { icon: MdAdjust, gradient: 'from-slate-500 to-slate-800' },
  sniper: { icon: MdAdjust, gradient: 'from-slate-500 to-slate-800' },
  zombie: { icon: MdAdjust, gradient: 'from-green-600 to-emerald-900' },
  simulation: { icon: MdSettings, gradient: 'from-teal-400 to-emerald-700' },
  cooking: { icon: MdSettings, gradient: 'from-orange-300 to-amber-600' },
  sports: { icon: MdSportsSoccer, gradient: 'from-emerald-400 to-sky-500' },
  soccer: { icon: MdSportsSoccer, gradient: 'from-emerald-400 to-sky-500' },
  football: { icon: MdSportsSoccer, gradient: 'from-emerald-400 to-sky-500' },
  basketball: { icon: MdSportsSoccer, gradient: 'from-emerald-400 to-sky-500' },
  tennis: { icon: MdSportsSoccer, gradient: 'from-emerald-400 to-sky-500' },
  pool: { icon: MdSportsSoccer, gradient: 'from-emerald-400 to-sky-500' },
  strategy: { icon: MdLightbulb, gradient: 'from-orange-400 to-red-600' },
  'tower-defense': { icon: MdLightbulb, gradient: 'from-orange-400 to-red-600' },
  trivia: { icon: MdBook, gradient: 'from-teal-400 to-blue-600' },
  word: { icon: MdBook, gradient: 'from-yellow-300 to-amber-600' },
  escape: { icon: MdMap, gradient: 'from-teal-500 to-emerald-800' },
  platform: { icon: MdVideogameAsset, gradient: 'from-sky-400 to-blue-700' },
  stickman: { icon: MdFlashOn, gradient: 'from-zinc-500 to-zinc-800' },
  multiplayer: { icon: MdGroup, gradient: 'from-indigo-500 to-cyan-400' },
  'two-player': { icon: MdGroup, gradient: 'from-indigo-500 to-cyan-400' },
  skill: { icon: MdExtension, gradient: 'from-cyan-400 to-blue-600' },
  flash: { icon: MdFlashOn, gradient: 'from-yellow-300 to-orange-500' },
  fighting: { icon: MdFlashOn, gradient: 'from-red-500 to-orange-500' },
  decoration: { icon: MdStyle, gradient: 'from-purple-300 to-pink-400' },
  new: { icon: MdLightbulb, gradient: 'from-emerald-300 to-teal-500' },
  animals: { icon: MdFavorite, gradient: 'from-green-300 to-emerald-500' },
  farm: { icon: MdSettings, gradient: 'from-lime-400 to-emerald-600' },
  restaurant: { icon: MdSettings, gradient: 'from-orange-300 to-amber-600' },
}

export function categoryStyle(slug: string): { icon: IconType; gradient: string } {
  return CATEGORY_STYLE[slug] ?? FALLBACK_STYLE
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

export function getGamesByCategory(slug: string): Game[] {
  const resolved = resolveCategorySlug(slug)
  return ALL_GAMES.filter((g) => g.categories.some((c) => c.slug === resolved))
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
  return ALL_GAMES.find((g) => g.slug === slug)
}
