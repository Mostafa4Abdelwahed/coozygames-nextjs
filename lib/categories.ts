import type { IconType } from 'react-icons'
import {
  MdAdjust,
  MdBook,
  MdDirectionsCar,
  MdExtension,
  MdFavorite,
  MdFlashOn,
  MdGridOn,
  MdHelp,
  MdHistory,
  MdHome,
  MdLanguage,
  MdLightbulb,
  MdMap,
  MdNewReleases,
  MdSettings,
  MdSportsSoccer,
  MdStyle,
  MdTouchApp,
  MdUpdate,
  MdVideogameAsset,
  MdWhatshot,
} from 'react-icons/md'

export type Category = {
  slug: string
  label: string
  icon: IconType
}

export const SIDEBAR_TOP: { label: string; href: string; icon: IconType; disabled?: boolean }[] = [
  { label: 'الرئيسية', href: '/', icon: MdHome },
  { label: 'لُعبت مؤخرًا', href: '', icon: MdHistory, disabled: true },
  { label: 'جديد', href: '/games/?sort=new', icon: MdNewReleases },
  { label: 'ألعاب رائجة', href: '/games/?sort=hot', icon: MdWhatshot },
  { label: 'محدّثة', href: '/games/?sort=updated', icon: MdUpdate },
]

export const CATEGORIES: Category[] = [
  { slug: 'io', label: '.io', icon: MdLanguage },
  { slug: 'action', label: 'Action', icon: MdFlashOn },
  { slug: 'adventure', label: 'Adventure', icon: MdMap },
  { slug: 'arcade', label: 'Arcade', icon: MdVideogameAsset },
  { slug: 'beauty', label: 'Beauty', icon: MdFavorite },
  { slug: 'board', label: 'Board', icon: MdGridOn },
  { slug: 'card', label: 'Card', icon: MdStyle },
  { slug: 'clicker', label: 'Clicker', icon: MdTouchApp },
  { slug: 'driving', label: 'Driving', icon: MdDirectionsCar },
  { slug: 'puzzle', label: 'Puzzle', icon: MdExtension },
  { slug: 'shooting', label: 'Shooting', icon: MdAdjust },
  { slug: 'simulation', label: 'Simulation', icon: MdSettings },
  { slug: 'sports', label: 'Sports', icon: MdSportsSoccer },
  { slug: 'strategy', label: 'Strategy', icon: MdLightbulb },
  { slug: 'trivia', label: 'Trivia', icon: MdHelp },
  { slug: 'word', label: 'Word', icon: MdBook },
]

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug)
}
