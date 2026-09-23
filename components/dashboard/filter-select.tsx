'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'

const RESET_VALUE = 'all'

type Option = { value: string; label: string }

export function FilterSelect({
  param,
  value,
  placeholder,
  options,
  ariaLabel,
}: {
  param: string
  value: string
  placeholder: string
  options: Option[]
  ariaLabel: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function update(next: string) {
    const sp = new URLSearchParams(searchParams.toString())
    if (next === RESET_VALUE || next === '') sp.delete(param)
    else sp.set(param, next)
    sp.delete('page')
    router.push(`${pathname}?${sp.toString()}`, { scroll: false })
  }

  const isClear = value === RESET_VALUE || value === ''
  const label = options.find((o) => o.value === value)?.label ?? placeholder

  return (
    <Select value={isClear ? RESET_VALUE : value} onValueChange={(next) => update(next ?? '')}>
      <SelectTrigger className="h-9 gap-1.5" aria-label={ariaLabel}>
        <span className="truncate text-sm">{label}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={RESET_VALUE} label={placeholder}>
          {placeholder}
        </SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} label={o.label}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function FilterSearch({ q, placeholder }: { q: string; placeholder: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(q)

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const sp = new URLSearchParams(searchParams.toString())
    const trimmed = value.trim()
    if (trimmed) sp.set('q', trimmed)
    else sp.delete('q')
    sp.delete('page')
    router.push(`${pathname}?${sp.toString()}`, { scroll: false })
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      className="relative min-w-0 flex-1"
    >
      <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-9 ps-9"
      />
    </form>
  )
}