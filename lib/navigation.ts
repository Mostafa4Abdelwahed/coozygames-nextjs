/** Only allow in-app path redirects (no scheme, no protocol-relative URLs). */
export function safePath(value: string | null | undefined, fallback: string): string {
  if (value && value.startsWith('/') && !value.startsWith('//') && !value.includes('://')) return value
  return fallback
}