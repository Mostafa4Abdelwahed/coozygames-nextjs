'use client'

import { useState } from 'react'
import { Suspense } from 'react'
import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MdMenu, MdSearch } from 'react-icons/md'
import type { NavCategory } from '@/lib/category-meta'
import { AuthArea } from './auth-area'
import { SidebarNav, SidebarNavStatic } from './sidebar-nav'
import { InstallPrompt } from './install-prompt'

const SearchOverlay = dynamic(
  () => import('@/components/search-overlay').then((m) => m.SearchOverlay),
  { ssr: false },
)

export function SiteShell({ children, categories }: { children: ReactNode; categories: NavCategory[] }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // /play and /dashboard are dedicated full-screen routes: no header, sidebar or overlays.
  if (pathname?.startsWith('/play') || pathname?.startsWith('/dashboard')) {
    return <>{children}</>
  }

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
          <AuthArea />
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
        className={`group fixed top-header-mobile inset-s-0 z-30 h-[calc(100dvh-56px)] w-sidebar border-e border-night-60 bg-night-100 transition-[width] duration-200 ease-in-out sm:top-header sm:z-5 sm:h-[calc(100vh-60px)] min-[1910px]:w-sidebar ${
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
          <Suspense fallback={<SidebarNavStatic forceLabels={sidebarOpen} categories={categories} />}>
            <SidebarNav forceLabels={sidebarOpen} categories={categories} />
          </Suspense>
        </div>
      </nav>

      <main
        id="layoutMain"
        className={`pt-header-mobile ps-0 sm:pt-header min-[1910px]:ps-sidebar ${sidebarOpen ? 'sm:ps-sidebar' : 'sm:ps-sidebar-collapsed'}`}
      >
        {children}
      </main>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}

      <InstallPrompt />
    </div>
  )
}
