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
  MdHelp,
  MdLanguage,
  MdLightbulb,
  MdMap,
  MdSettings,
  MdSportsSoccer,
  MdVideogameAsset,
  MdWhatshot,
} from 'react-icons/md'

export type Game = {
  slug: string
  title: string
  category: string
  plays: string
  rating: number
  icon: IconType
  gradient: string
}

export const TRENDING_GAMES: Game[] = [
  { slug: 'metro-runner', title: 'عدّاء المترو', category: 'Arcade', plays: '8.3M', rating: 4.7, icon: MdVideogameAsset, gradient: 'from-violet-500 to-cyan-400' },
  { slug: 'heroes-battle', title: 'معركة الأبطال', category: 'Action', plays: '5.2M', rating: 4.6, icon: MdFlashOn, gradient: 'from-rose-500 to-amber-400' },
  { slug: 'multiplayer-arena', title: 'ساحة اللعب الجماعي', category: 'Multiplayer', plays: '6.1M', rating: 4.7, icon: MdGroup, gradient: 'from-indigo-500 to-cyan-400' },
  { slug: 'super-football', title: 'كرة القدم الخارقة', category: 'Sports', plays: '4.0M', rating: 4.8, icon: MdSportsSoccer, gradient: 'from-emerald-400 to-sky-500' },
  { slug: 'io-race-arena', title: 'حلبة السباق الجماعي', category: '.io', plays: '3.7M', rating: 4.5, icon: MdLanguage, gradient: 'from-fuchsia-500 to-violet-500' },
  { slug: 'mind-puzzle', title: 'لغز العقول', category: 'Puzzle', plays: '3.1M', rating: 4.9, icon: MdExtension, gradient: 'from-amber-400 to-rose-400' },
  { slug: 'car-racing-pro', title: 'سباق السيارات الاحترافي', category: 'Driving', plays: '2.4M', rating: 4.8, icon: MdDirectionsCar, gradient: 'from-sky-400 to-indigo-600' },
  { slug: 'elite-sniper', title: 'القناص المحترف', category: 'Shooting', plays: '2.9M', rating: 4.5, icon: MdAdjust, gradient: 'from-slate-500 to-slate-800' },
]

export const NEW_GAMES: Game[] = [
  { slug: 'candy-match', title: 'مطابقة الحلوى', category: 'Puzzle', plays: '450K', rating: 4.5, icon: MdFavorite, gradient: 'from-pink-400 to-rose-500' },
  { slug: 'ninja-run', title: 'ركضة النينجا', category: 'Action', plays: '320K', rating: 4.4, icon: MdFlashOn, gradient: 'from-neutral-700 to-black' },
  { slug: 'farm-simulator', title: 'محاكي المزرعة', category: 'Simulation', plays: '2.2M', rating: 4.6, icon: MdSettings, gradient: 'from-lime-400 to-emerald-600' },
  { slug: 'war-strategy', title: 'حرب الاستراتيجية', category: 'Strategy', plays: '1.5M', rating: 4.6, icon: MdLightbulb, gradient: 'from-orange-400 to-red-600' },
  { slug: 'quiz-challenge', title: 'تحدي المعلومات', category: 'Trivia', plays: '700K', rating: 4.3, icon: MdHelp, gradient: 'from-teal-400 to-blue-600' },
  { slug: 'crosswords', title: 'كلمات متقاطعة', category: 'Word', plays: '900K', rating: 4.4, icon: MdBook, gradient: 'from-yellow-300 to-amber-600' },
  { slug: 'kings-chess', title: 'شطرنج الملوك', category: 'Board', plays: '1.2M', rating: 4.9, icon: MdGridOn, gradient: 'from-stone-400 to-stone-700' },
  { slug: 'space-adventure', title: 'مغامرات الفضاء', category: 'Adventure', plays: '1.8M', rating: 4.7, icon: MdMap, gradient: 'from-purple-500 to-indigo-900' },
]

export const ACTION_GAMES: Game[] = [
  { slug: 'street-fighter-2d', title: 'مقاتل الشوارع', category: 'Action', plays: '3.0M', rating: 4.6, icon: MdFlashOn, gradient: 'from-red-500 to-orange-500' },
  { slug: 'dragon-fight', title: 'قتال التنين', category: 'Action', plays: '2.3M', rating: 4.8, icon: MdWhatshot, gradient: 'from-orange-500 to-yellow-500' },
  { slug: 'zombie-hunter', title: 'صائد الزومبي', category: 'Action', plays: '2.0M', rating: 4.5, icon: MdFlashOn, gradient: 'from-green-500 to-emerald-800' },
  { slug: 'robot-war', title: 'حرب الروبوتات', category: 'Action', plays: '1.6M', rating: 4.5, icon: MdSettings, gradient: 'from-slate-400 to-slate-700' },
  { slug: 'shadow-strike', title: 'ضربة الظل', category: 'Action', plays: '1.1M', rating: 4.6, icon: MdFlashOn, gradient: 'from-zinc-600 to-black' },
  { slug: 'ninja-blade', title: 'سيف النينجا', category: 'Action', plays: '890K', rating: 4.7, icon: MdWhatshot, gradient: 'from-red-600 to-zinc-900' },
]

export const PUZZLE_GAMES: Game[] = [
  { slug: 'brain-test-tricky', title: 'اختبار العقل', category: 'Puzzle', plays: '2.7M', rating: 4.7, icon: MdLightbulb, gradient: 'from-amber-300 to-orange-500' },
  { slug: 'block-puzzle-wood', title: 'مكعبات الخشب', category: 'Puzzle', plays: '1.9M', rating: 4.5, icon: MdExtension, gradient: 'from-yellow-600 to-amber-800' },
  { slug: 'jewel-quest', title: 'رحلة الجواهر', category: 'Puzzle', plays: '1.4M', rating: 4.6, icon: MdFavorite, gradient: 'from-cyan-400 to-blue-600' },
  { slug: 'match-3-mania', title: 'جنون المطابقة', category: 'Puzzle', plays: '1.1M', rating: 4.3, icon: MdExtension, gradient: 'from-pink-400 to-purple-600' },
  { slug: 'maze-escape', title: 'الهروب من المتاهة', category: 'Puzzle', plays: '950K', rating: 4.6, icon: MdMap, gradient: 'from-teal-500 to-emerald-800' },
  { slug: 'sudoku-classic', title: 'سودوكو كلاسيك', category: 'Puzzle', plays: '800K', rating: 4.4, icon: MdGridOn, gradient: 'from-sky-300 to-indigo-500' },
]

export const ALL_GAMES: Game[] = [...TRENDING_GAMES, ...NEW_GAMES, ...ACTION_GAMES, ...PUZZLE_GAMES]

const SLUG_TO_LABEL: Record<string, string> = {
  io: '.io',
}

export function getGamesByCategory(slug: string): Game[] {
  const label = SLUG_TO_LABEL[slug] ?? slug
  return ALL_GAMES.filter((g) => g.category.toLowerCase() === label.toLowerCase())
}
