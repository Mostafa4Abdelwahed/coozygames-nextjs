import Link from 'next/link'
import { MdChevronLeft, MdChevronRight } from 'react-icons/md'

export const PAGE_SIZE = 40

function pageNumbers(page: number, total: number): (number | '…')[] {
  const nums = [...new Set([1, total, page - 1, page, page + 1])]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b)
  const out: (number | '…')[] = []
  let prev = 0
  for (const n of nums) {
    if (n - prev > 1) out.push('…')
    out.push(n)
    prev = n
  }
  return out
}

export function Pager({
  page,
  totalPages,
  basePath,
  params = {},
}: {
  page: number
  totalPages: number
  basePath: string
  params?: Record<string, string>
}) {
  if (totalPages <= 1) return null

  const href = (p: number) => {
    const q = new URLSearchParams(params)
    if (p > 1) q.set('page', String(p))
    else q.delete('page')
    const s = q.toString()
    return `${basePath}${s ? `?${s}` : ''}`
  }

  const btn =
    'flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-extrabold transition'

  return (
    <nav aria-label="التنقل بين الصفحات" className="flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} aria-label="الصفحة السابقة" className={`${btn} bg-night-80 text-white hover:bg-night-60`}>
          <MdChevronRight size={20} />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${btn} bg-night-80 text-mist-30 opacity-40`}>
          <MdChevronRight size={20} />
        </span>
      )}

      {pageNumbers(page, totalPages).map((n, i) =>
        n === '…' ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 font-bold text-mist-50">
            …
          </span>
        ) : (
          <Link
            key={n}
            href={href(n)}
            aria-label={`صفحة ${n}`}
            aria-current={n === page ? 'page' : undefined}
            className={`${btn} ${n === page ? 'bg-brand-100 text-white' : 'bg-night-80 text-mist-50 hover:text-white'}`}
          >
            {n}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={href(page + 1)} aria-label="الصفحة التالية" className={`${btn} bg-night-80 text-white hover:bg-night-60`}>
          <MdChevronLeft size={20} />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${btn} bg-night-80 text-mist-30 opacity-40`}>
          <MdChevronLeft size={20} />
        </span>
      )}
    </nav>
  )
}
