'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { IconType } from 'react-icons'
import {
  MdAdjust,
  MdBook,
  MdChevronLeft,
  MdClose,
  MdDirectionsCar,
  MdExtension,
  MdFlashOn,
  MdGridOn,
  MdGroup,
  MdHelp,
  MdLanguage,
  MdLightbulb,
  MdMap,
  MdSearch,
  MdSettings,
  MdSportsSoccer,
  MdTrendingUp,
  MdVideogameAsset,
} from 'react-icons/md'

type MockGame = {
  slug: string
  title: string
  category: string
  plays: string
  rating: number
  icon: IconType
}

const MOCK_GAMES: MockGame[] = [
  { slug: 'car-racing-pro', title: 'سباق السيارات الاحترافي', category: 'Driving', plays: '2.4M', rating: 4.8, icon: MdDirectionsCar },
  { slug: 'space-adventure', title: 'مغامرات الفضاء', category: 'Adventure', plays: '1.8M', rating: 4.7, icon: MdMap },
  { slug: 'mind-puzzle', title: 'لغز العقول', category: 'Puzzle', plays: '3.1M', rating: 4.9, icon: MdExtension },
  { slug: 'heroes-battle', title: 'معركة الأبطال', category: 'Action', plays: '5.2M', rating: 4.6, icon: MdFlashOn },
  { slug: 'super-football', title: 'كرة القدم الخارقة', category: 'Sports', plays: '4.0M', rating: 4.8, icon: MdSportsSoccer },
  { slug: 'elite-sniper', title: 'القناص المحترف', category: 'Shooting', plays: '2.9M', rating: 4.5, icon: MdAdjust },
  { slug: 'metro-runner', title: 'عدّاء المترو', category: 'Arcade', plays: '8.3M', rating: 4.7, icon: MdVideogameAsset },
  { slug: 'kings-chess', title: 'شطرنج الملوك', category: 'Board', plays: '1.2M', rating: 4.9, icon: MdGridOn },
  { slug: 'crosswords', title: 'كلمات متقاطعة', category: 'Word', plays: '900K', rating: 4.4, icon: MdBook },
  { slug: 'quiz-challenge', title: 'تحدي المعلومات', category: 'Trivia', plays: '700K', rating: 4.3, icon: MdHelp },
  { slug: 'war-strategy', title: 'حرب الاستراتيجية', category: 'Strategy', plays: '1.5M', rating: 4.6, icon: MdLightbulb },
  { slug: 'io-race-arena', title: 'حلبة السباق الجماعي', category: '.io', plays: '3.7M', rating: 4.5, icon: MdLanguage },
  { slug: 'multiplayer-arena', title: 'ساحة اللعب الجماعي', category: 'Multiplayer', plays: '6.1M', rating: 4.7, icon: MdGroup },
  { slug: 'farm-simulator', title: 'محاكي المزرعة', category: 'Simulation', plays: '2.2M', rating: 4.6, icon: MdSettings },
]

const POPULAR_SEARCHES = ['سباق', 'كرة القدم', 'Puzzle', 'شطرنج', 'Action']

const DEBOUNCE_MS = 300

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const results = useMemo(() => {
    if (!debouncedQuery) return []
    const q = debouncedQuery.toLowerCase()
    return MOCK_GAMES.filter(
      (g) => g.title.toLowerCase().includes(q) || g.category.toLowerCase().includes(q),
    ).slice(0, 7)
  }, [debouncedQuery])

  const isTyping = query.trim() !== debouncedQuery

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4" role="dialog" aria-modal="true" aria-label="بحث">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative mt-[8vh] w-full max-w-xl overflow-hidden rounded-2xl border border-night-60 bg-night-80 shadow-2xl sm:mt-[12vh]">
        <div className="flex items-center gap-2 border-b border-night-60 px-4">
          <MdSearch size={22} className="shrink-0 text-mist-50" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن الألعاب والتصنيفات"
            aria-label="ابحث عن الألعاب والتصنيفات"
            className="h-14 w-full bg-transparent text-start text-base font-bold text-white outline-none placeholder:text-mist-50"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="مسح البحث"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-mist-50 transition hover:bg-night-60 hover:text-white"
            >
              <MdClose size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق البحث"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-night-60 text-mist-50 transition hover:text-white"
          >
            <MdClose size={18} />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {isTyping ? (
            <div className="flex flex-col gap-1" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl px-3 py-2.5">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-night-60" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-3 w-2/3 rounded bg-night-60" />
                    <div className="h-2.5 w-1/3 rounded bg-night-60" />
                  </div>
                </div>
              ))}
            </div>
          ) : debouncedQuery === '' ? (
            <div className="px-2 py-1">
              <p className="flex items-center gap-2 px-2 py-2 text-sm font-bold text-mist-50">
                <MdTrendingUp size={18} />
                عمليات بحث رائجة
              </p>
              <div className="flex flex-wrap gap-2 px-2 pb-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="rounded-full border border-night-60 bg-night-60 px-4 py-1.5 text-sm font-bold text-white transition hover:border-brand-100 hover:bg-brand-100"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {results.map((game) => (
                <li key={game.slug}>
                  <Link
                    href={`/game/${game.slug}/`}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-night-60"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-night-60 text-brand-60">
                      <game.icon size={22} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col text-start">
                      <span className="truncate text-[15px] font-bold text-white">{game.title}</span>
                      <span className="text-xs font-semibold text-mist-50">
                        {game.category} • {game.plays} • ★ {game.rating}
                      </span>
                    </span>
                    <MdChevronLeft size={20} className="shrink-0 text-mist-50" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <MdSearch size={36} className="text-mist-50" />
              <p className="font-bold text-white">لا توجد نتائج لـ &quot;{debouncedQuery}&quot;</p>
              <p className="text-sm text-mist-50">جرّب كلمة مختلفة (النتائج تجريبية)</p>
            </div>
          )}
        </div>

        <div className="border-t border-night-60 px-4 py-2 text-xs text-mist-50">
          نتائج تجريبية (mock) — تُفلتر محليًا بعد {DEBOUNCE_MS}ms من التوقف عن الكتابة
        </div>
      </div>
    </div>
  )
}
