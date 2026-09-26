import { pool } from '@/lib/db'

/** Server-only helpers for runtime configuration ("env from the dashboard"). */

export type SettingSource = 'env' | 'db'

export type SettingView = {
  key: string
  label: string
  value: string
  source: SettingSource
  hasDb: boolean
  hasEnv: boolean
  isSecret: boolean
  revealable: boolean
  updatedAt: string | null
}

/** Known env keys the app actually reads, with Arabic labels + secret flags. */
export const KNOWN_SETTINGS: { key: string; label: string; isSecret: boolean }[] = [
  { key: 'WISP_HEALTH_URL', label: 'رابط فحص صحة Wisp', isSecret: false },
  { key: 'NEXT_PUBLIC_WISP_URL', label: 'رابط Wisp العام', isSecret: false },
  { key: 'ADMIN_USER_IDS', label: 'معرّفات الأدمنز المبدئية', isSecret: false },
  { key: 'PREMIUM_MONTHLY_PRICE', label: 'سعر الاشتراك الشهري', isSecret: false },
  { key: 'PARTNER_API_KEY', label: 'مفتاح الـ Partner API', isSecret: true },
  { key: 'GOOGLE_CLIENT_ID', label: 'Google Client ID', isSecret: false },
  { key: 'GOOGLE_CLIENT_SECRET', label: 'Google Client Secret', isSecret: true },
  { key: 'DATABASE_URL', label: 'اتصال قاعدة البيانات', isSecret: true },
]

/** Read a runtime setting: DB override first, then the real process.env value. */
export async function getSetting(key: string): Promise<string | undefined> {
  const { rows } = await pool.query<{ value: string }>(
    'SELECT value FROM app_settings WHERE key_name = $1',
    [key],
  )
  if (rows.length > 0) return rows[0].value
  return process.env[key] ?? undefined
}

/** Merge known env keys + DB overrides into one serializable list for the page. */
export async function listSettings(): Promise<SettingView[]> {
  const { rows } = await pool.query<{
    key_name: string
    value: string
    is_secret: boolean
    updated_at: Date
  }>('SELECT key_name, value, is_secret, updated_at FROM app_settings ORDER BY key_name')

  const dbRow = new Map(rows.map((r) => [r.key_name, r]))
  const merged = new Map<string, SettingView>()

  for (const k of KNOWN_SETTINGS) {
    const db = dbRow.get(k.key)
    const envValue = process.env[k.key] ?? ''
    const hasDb = Boolean(db)
    let value = envValue
    let source: SettingSource = 'env'
    if (hasDb) {
      value = db!.value
      source = 'db'
    } else if (k.isSecret) {
      // env-sourced secret: never ship the real value to the client.
      value = ''
    }
    merged.set(k.key, {
      key: k.key,
      label: k.label,
      value,
      source,
      hasDb,
      hasEnv: Boolean(envValue),
      isSecret: hasDb ? db!.is_secret : k.isSecret,
      revealable: hasDb,
      updatedAt: db ? db.updated_at.toISOString() : null,
    })
  }

  // Any DB keys added by the admin that aren't in the known list.
  for (const r of rows) {
    if (merged.has(r.key_name)) continue
    merged.set(r.key_name, {
      key: r.key_name,
      label: r.key_name,
      value: r.value,
      source: 'db',
      hasDb: true,
      hasEnv: Boolean(process.env[r.key_name]),
      isSecret: r.is_secret,
      revealable: r.is_secret,
      updatedAt: r.updated_at.toISOString(),
    })
  }

  return Array.from(merged.values())
}