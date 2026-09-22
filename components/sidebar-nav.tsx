'use client'

import { memo } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { SIDEBAR_TOP, categoryStyle, type NavCategory } from '@/lib/category-meta'
import { SidebarItem } from './sidebar-item'

function normalize(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

function itemKey(href: string): string {
  const clean = normalize(href)
  if (clean === '/') return '/'
  if (clean === '/games') {
    const query = href.split('?')[1] ?? ''
    return `games:${new URLSearchParams(query).get('sort') ?? 'hot'}`
  }
  return clean
}

function SidebarNavList({
  forceLabels,
  activeKey,
  categories,
}: {
  forceLabels: boolean
  activeKey: string
  categories: NavCategory[]
}) {
  return (
    <>
      {SIDEBAR_TOP.map((item) => (
        <SidebarItem
          key={item.label}
          {...item}
          active={!item.disabled && itemKey(item.href) === activeKey}
          forceLabels={forceLabels}
        />
      ))}

      <div role="separator" className="mx-4 my-2 border-t border-night-60" />

      {categories.map((cat) => {
        const href = `/game-category/${cat.slug}/`
        return (
          <SidebarItem
            key={cat.slug}
            label={cat.labelAr}
            href={href}
            icon={categoryStyle(cat.slug).icon}
            active={normalize(href) === activeKey}
            forceLabels={forceLabels}
          />
        )
      })}
    </>
  )
}

export const SidebarNav = memo(function SidebarNav({
  forceLabels,
  categories,
}: {
  forceLabels: boolean
  categories: NavCategory[]
}) {
  const pathname = normalize(usePathname())
  const sort = useSearchParams().get('sort') ?? 'hot'
  const activeKey = pathname === '/games' ? `games:${sort}` : pathname

  return <SidebarNavList forceLabels={forceLabels} activeKey={activeKey} categories={categories} />
})

export const SidebarNavStatic = memo(function SidebarNavStatic({
  forceLabels,
  categories,
}: {
  forceLabels: boolean
  categories: NavCategory[]
}) {
  return <SidebarNavList forceLabels={forceLabels} activeKey="/" categories={categories} />
})
