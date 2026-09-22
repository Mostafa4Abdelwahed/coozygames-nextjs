'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
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
  MdHistory,
  MdHome,
  MdLanguage,
  MdLightbulb,
  MdMap,
  MdMenu,
  MdNewReleases,
  MdSearch,
  MdSettings,
  MdSportsSoccer,
  MdStyle,
  MdTouchApp,
  MdUpdate,
  MdVideogameAsset,
  MdWhatshot,
} from 'react-icons/md'

const SearchOverlay = dynamic(
  () => import('@/components/search-overlay').then((m) => m.SearchOverlay),
  { ssr: false },
)

const SIDEBAR_TOP = [
  { label: 'الرئيسية', href: '/', icon: MdHome, active: true },
  { label: 'لُعبت مؤخرًا', href: '', icon: MdHistory, disabled: true },
  { label: 'جديد', href: '/games/?sort=new', icon: MdNewReleases },
  { label: 'ألعاب رائجة', href: '/games/?sort=hot', icon: MdWhatshot },
  { label: 'محدّثة', href: '/games/?sort=updated', icon: MdUpdate },
  { label: 'Multiplayer', href: '/game-tag/multiplayer/', icon: MdGroup },
]

const SIDEBAR_CATS = [
  { label: '.io', slug: 'io', icon: MdLanguage },
  { label: 'Action', slug: 'action', icon: MdFlashOn },
  { label: 'Adventure', slug: 'adventure', icon: MdMap },
  { label: 'Arcade', slug: 'arcade', icon: MdVideogameAsset },
  { label: 'Beauty', slug: 'beauty', icon: MdFavorite },
  { label: 'Board', slug: 'board', icon: MdGridOn },
  { label: 'Card', slug: 'card', icon: MdStyle },
  { label: 'Clicker', slug: 'clicker', icon: MdTouchApp },
  { label: 'Driving', slug: 'driving', icon: MdDirectionsCar },
  { label: 'Puzzle', slug: 'puzzle', icon: MdExtension },
  { label: 'Shooting', slug: 'shooting', icon: MdAdjust },
  { label: 'Simulation', slug: 'simulation', icon: MdSettings },
  { label: 'Sports', slug: 'sports', icon: MdSportsSoccer },
  { label: 'Strategy', slug: 'strategy', icon: MdLightbulb },
  { label: 'Trivia', slug: 'trivia', icon: MdHelp },
  { label: 'Word', slug: 'word', icon: MdBook },
]

function SidebarItem({ label, href, icon: ItemIcon, active, disabled, forceLabels }: { label: string; href: string; icon: IconType; active?: boolean; disabled?: boolean; forceLabels?: boolean }) {
  const inner = (
    <div
      className={`flex h-8.5 w-sidebar items-center border-start-6 select-none ${
        active ? 'border-start-brand' : ''
      } ${disabled ? 'opacity-30' : 'hover:cursor-pointer'}`}
    >
      <span className="flex h-8.5 w-sidebar-collapsed shrink-0 items-center justify-center -ms-1.5">
        <ItemIcon size={22} className={active ? 'text-brand-60' : 'text-mist-30'} />
      </span>
      <div
        className={`max-w-fit overflow-hidden text-start text-[15px] font-semibold whitespace-nowrap text-ellipsis transition-all ${
          active ? 'text-brand-60' : 'text-white'
        } invisible opacity-0 max-sm:visible max-sm:opacity-100 sm:group-hover:visible sm:group-hover:opacity-100 min-[1910px]:visible min-[1910px]:opacity-100${forceLabels ? ' sm:visible sm:opacity-100' : ''}`}
      >
        {label}
      </div>
    </div>
  )

  if (disabled || !href) return <div aria-label={label}>{inner}</div>
  return <Link aria-label={label} href={href}>{inner}</Link>
}

export function SiteShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <div className="relative flex min-h-screen flex-col items-stretch bg-night-100">
      {/* Header */}
      <div id="czyHeader" className="fixed inset-x-0 top-0 z-12 flex h-header-mobile flex-row items-center justify-between bg-night-80 shadow-[0_3px_3px_-2px_rgba(0,0,0,0.2),0_3px_4px_0_rgba(0,0,0,0.14),0_1px_8px_0_rgba(0,0,0,0.12)] sm:h-header min-[1910px]:border-b-0 min-[1910px]:shadow-none">
        <div className="flex min-w-0 flex-row items-center ps-2 sm:ps-2">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="me-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-[30px] text-mist-90 transition hover:text-mist-50 sm:h-12 sm:w-12"
            aria-label="فتح القائمة الجانبية أو إغلاقها"
            aria-controls="mainNav"
            aria-expanded={sidebarOpen}
          >
            <MdMenu size={22} />
          </button>
          <Link href="/" rel="home" className="min-w-0">
            <span className="block h-9 content-center truncate bg-[linear-gradient(90deg,#c4b5fd,#22d3ee)] bg-clip-text text-lg font-extrabold text-transparent sm:text-xl">كوزي جيم</span>
          </Link>
        </div>

        {/* Desktop search trigger */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="absolute top-1/2 left-1/2 hidden h-10 w-115 -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-[30px] border border-transparent bg-night-40 px-4 text-start text-base font-bold text-mist-50 transition hover:border-night-60 min-[1082px]:flex"
        >
          <span className="flex-1 truncate">ابحث عن الألعاب والتصنيفات</span>
          <MdSearch size={20} className="shrink-0" />
        </button>

        <div className="ms-auto flex min-w-0 flex-row items-center justify-end gap-1 pe-2 sm:ms-2 sm:min-w-115 sm:gap-4 sm:pe-4 min-[1910px]:pe-5">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-mist-90 transition hover:text-mist-50 min-[1082px]:hidden"
            aria-label="بحث"
          >
            <MdSearch size={22} />
          </button>
          <Link
            className="flex h-9 items-center justify-center rounded-[30px] bg-brand-100 px-3 text-sm font-extrabold whitespace-nowrap text-mist-100 transition hover:bg-brand-80 active:opacity-70 sm:h-10 sm:px-4 sm:text-base"
            href="/login/"
          >
            <span>تسجيل الدخول</span>
          </Link>
        </div>
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-20 bg-black/60 sm:hidden"
        />
      )}

      {/* Sidebar: off-canvas drawer on mobile, fixed rail on sm+ */}
      <nav
        id="mainNav"
        aria-label="التنقل بين الألعاب"
        className={`group fixed top-header-mobile inset-s-0 z-30 h-[calc(100dvh-56px)] w-sidebar border-e border-night-60 bg-night-100 transition-all duration-200 ease-in-out sm:top-header sm:z-5 sm:h-[calc(100vh-60px)] min-[1910px]:w-sidebar ${
          sidebarOpen ? 'sm:w-sidebar' : 'sm:w-sidebar-collapsed'
        } ${
          sidebarOpen ? 'max-sm:translate-x-0' : 'max-sm:-translate-x-full max-sm:rtl:translate-x-full'
        } sm:hover:w-sidebar`}
      >
        <div
          id="sidebarContainer"
          onClick={() => {
            if (window.matchMedia('(max-width: 639.98px)').matches) setSidebarOpen(false)
          }}
          className="flex h-full w-full flex-col overflow-x-hidden overflow-y-auto pt-4 pb-7.5 no-scrollbar"
        >
          {SIDEBAR_TOP.map((item) => (
            <SidebarItem key={item.label} {...item} forceLabels={sidebarOpen} />
          ))}

          <div role="separator" className="mx-4 my-2 border-t border-night-60" />

          {SIDEBAR_CATS.map((cat) => (
            <SidebarItem
              key={cat.slug}
              label={cat.label}
              href={`/game-category/${cat.slug}/`}
              icon={cat.icon}
              forceLabels={sidebarOpen}
            />
          ))}
        </div>
      </nav>

      <main
        id="layoutMain"
        className={`pt-header-mobile ps-0 sm:pt-header min-[1910px]:ps-sidebar ${sidebarOpen ? 'sm:ps-sidebar' : 'sm:ps-sidebar-collapsed'}`}
      >
        {children}
      </main>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </div>
  )
}
