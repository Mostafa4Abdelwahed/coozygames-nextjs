import type { IconType } from 'react-icons'
import { MdGroup, MdHistory, MdHome, MdNewReleases, MdUpdate, MdWhatshot } from 'react-icons/md'
import { ALL_GAMES, categoryStyle, resolveCategorySlug } from './games'

export type Category = {
  slug: string
  label: string
  /** Arabic display label */
  labelAr: string
  icon: IconType
  /** Number of games in this category */
  count: number
}

const AR_LABELS: Record<string, string> = {
  sports: 'رياضية',
  racing: 'سباقات',
  brain: 'ذكاء',
  puzzle: 'بازل',
  arcade: 'أركيد',
  multiplayer: 'جماعية',
  action: 'أكشن',
  'two-player': 'لاعبان',
  car: 'سيارات',
  driving: 'قيادة',
  simulation: 'محاكاة',
  watermelon: 'بطيخ',
  'american-football': 'كرة أمريكية',
  platform: 'منصات',
  skill: 'مهارة',
  easy: 'سهلة',
  soccer: 'كرة القدم',
  war: 'حروب',
  strategy: 'استراتيجية',
  new: 'جديدة',
  shooting: 'تصويب',
  adventure: 'مغامرات',
  cards: 'ورق',
  card: 'ورق',
  fighting: 'قتال',
  obby: 'أوبي',
  'dress-up': 'تلبيس',
  beauty: 'تجميل',
  idle: 'تراكمية',
  color: 'تلوين',
  decoration: 'ديكور',
  flash: 'فلاش',
  educational: 'تعليمية',
  running: 'جري',
  board: 'لوحية',
  scary: 'رعب',
  survival: 'بقاء',
  basketball: 'سلة',
  tractor: 'جرارات',
  girls: 'بنات',
  matching: 'مطابقة',
  merge: 'دمج',
  zombie: 'زومبي',
  blocks: 'مكعبات',
  gun: 'أسلحة',
  slime: 'سلايم',
  ball: 'كرة',
  number: 'أرقام',
  bowling: 'بولينج',
  clicker: 'نقر',
  brainrot: 'برين روت',
  drawing: 'رسم',
  'bubble-shooter': 'فقاعات',
  airplane: 'طائرات',
  farm: 'مزرعة',
  animals: 'حيوانات',
  restaurant: 'مطاعم',
  nitrome: 'نيتروم',
  bike: 'دراجات',
  boat: 'قوارب',
  pizza: 'بيتزا',
  cats: 'قطط',
  chess: 'شطرنج',
  monster: 'وحوش',
  cooking: 'طبخ',
  cricket: 'كريكيت',
  'tower-defense': 'دفاع الأبراج',
  io: 'آي أو',
  tycoon: 'إدارة',
  dinosaur: 'ديناصورات',
  hair: 'تصفيف الشعر',
  'make-up': 'مكياج',
  doctor: 'طبيب',
  escape: 'هروب',
  stickman: 'ستيك مان',
  'hidden-object': 'أشياء مخفية',
  fishing: 'صيد',
  quiz: 'اختبارات',
  'battle-royale': 'باتل رويال',
  parkour: 'باركور',
  '3d': 'ثلاثية الأبعاد',
  words: 'كلمات',
  ragdoll: 'دمى',
  sniper: 'قناصة',
  typing: 'كتابة',
  robot: 'روبوتات',
  food: 'طعام',
  monkey: 'قرود',
  parking: 'ركن',
  space: 'فضاء',
  pool: 'بلياردو',
  boxing: 'ملاكمة',
  retro: 'كلاسيكية',
  construction: 'بناء',
  mahjong: 'ماجونج',
  snake: 'ثعبان',
  music: 'موسيقى',
  'co-op': 'تعاونية',
  'match-3': 'مطابقة 3',
  sudoku: 'سودوكو',
  tanks: 'دبابات',
  wrestling: 'مصارعة',
  difficult: 'صعبة',
}

export function categoryLabelAr(slug: string, fallback?: string): string {
  return AR_LABELS[slug] ?? fallback ?? slug
}

export const SIDEBAR_TOP: { label: string; href: string; icon: IconType; disabled?: boolean }[] = [
  { label: 'الرئيسية', href: '/', icon: MdHome },
  { label: 'لُعبت مؤخرًا', href: '', icon: MdHistory, disabled: true },
  { label: 'جديد', href: '/games/?sort=new', icon: MdNewReleases },
  { label: 'ألعاب رائجة', href: '/games/?sort=hot', icon: MdWhatshot },
  { label: 'محدّثة', href: '/games/?sort=updated', icon: MdUpdate },
]

/** Categories with fewer games than this are hidden from navigation. */
const MIN_CATEGORY_COUNT = 3

function buildCategories(): Category[] {
  const map = new Map<string, { label: string; count: number }>()
  for (const game of ALL_GAMES) {
    for (const cat of game.categories) {
      const entry = map.get(cat.slug) ?? { label: cat.label, count: 0 }
      entry.count += 1
      map.set(cat.slug, entry)
    }
  }
  return [...map.entries()]
    .map(([slug, { label, count }]) => ({
      slug,
      label,
      labelAr: AR_LABELS[slug] ?? label,
      icon: categoryStyle(slug).icon,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

const ALL_CATEGORIES: Category[] = buildCategories()

/** Categories shown in navigation (hidden when too few games). */
export const CATEGORIES: Category[] = ALL_CATEGORIES.filter((c) => c.count >= MIN_CATEGORY_COUNT)

/** Every slug present in the data (for static paths, including tiny ones). */
export function allCategorySlugs(): string[] {
  return ALL_CATEGORIES.map((c) => c.slug)
}

export function getCategory(slug: string): Category | undefined {
  const resolved = resolveCategorySlug(slug)
  return ALL_CATEGORIES.find((c) => c.slug === resolved)
}
