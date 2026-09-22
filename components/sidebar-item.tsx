import Link from 'next/link'
import type { IconType } from 'react-icons'

export function SidebarItem({ label, href, icon: ItemIcon, active, disabled, forceLabels }: { label: string; href: string; icon: IconType; active?: boolean; disabled?: boolean; forceLabels?: boolean }) {
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
