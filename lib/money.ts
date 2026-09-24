/** Client-safe money formatting helpers (no server deps). */

export function formatMoney(amount: number, currency: string): string {
  const formatted = amount.toLocaleString('en-US')
  return currency === 'EGP' ? `${formatted} ج.م` : `${formatted} ${currency}`
}

export function formatDateAr(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}