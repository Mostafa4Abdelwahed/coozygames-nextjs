'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { CATEGORIES, SIDEBAR_TOP } from '@/lib/categories'
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

function SidebarNavList({ forceLabels, activeKey }: { forceLabels: boolean; activeKey: string }) {
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

      {CATEGORIES.map((cat) => {
        const href = `/game-category/${cat.slug}/`
        return (
          <SidebarItem
            key={cat.slug}
            label={cat.label}
            href={href}
            icon={cat.icon}
            active={normalize(href) === activeKey}
            forceLabels={forceLabels}
          />
        )
      })}
    </>
  )
}

export function SidebarNav({ forceLabels }: { forceLabels: boolean }) {
  const pathname = normalize(usePathname())
  const sort = useSearchParams().get('sort') ?? 'hot'
  const activeKey = pathname === '/games' ? `games:${sort}` : pathname

  return <SidebarNavList forceLabels={forceLabels} activeKey={activeKey} />
}

export function SidebarNavStatic({ forceLabels }: { forceLabels: boolean }) {
  return <SidebarNavList forceLabels={forceLabels} activeKey="/" />
}
