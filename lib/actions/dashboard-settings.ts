'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db'
import { requireAdmin } from '@/lib/dashboard/admin'
import { logAudit } from '@/lib/dashboard/audit'

export type SettingActionState = { done: boolean; error?: string }

const KEY_RE = /^[A-Z][A-Z0-9_]{0,127}$/
const MAX_VALUE_LEN = 16000

function normalizeKey(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '_')
}

export async function saveSetting(
  _state: SettingActionState,
  formData: FormData,
): Promise<SettingActionState> {
  const actor = await requireAdmin()
  const key = normalizeKey(String(formData.get('key') ?? ''))
  const value = String(formData.get('value') ?? '')
  const isSecret = formData.get('isSecret') === '1'

  if (!key) return { done: true, error: 'settingsKeyRequired' }
  if (!KEY_RE.test(key)) {
    return { done: true, error: 'settingsKeyInvalid' }
  }
  if (value.length > MAX_VALUE_LEN) {
    return { done: true, error: 'settingsValueTooLong' }
  }

  await pool.query(
    `INSERT INTO app_settings (key_name, value, is_secret)
     VALUES ($1, $2, $3)
     ON CONFLICT (key_name)
     DO UPDATE SET value = EXCLUDED.value,
                   is_secret = EXCLUDED.is_secret,
                   updated_at = now()`,
    [key, value, isSecret],
  )
  await logAudit(actor.id, 'settings.save', 'app_settings', key, { isSecret })
  revalidatePath('/dashboard/settings', 'page')
  return { done: true }
}

export async function deleteSetting(
  _state: SettingActionState,
  formData: FormData,
): Promise<SettingActionState> {
  const actor = await requireAdmin()
  const key = normalizeKey(String(formData.get('key') ?? ''))

  if (!key) return { done: true, error: 'settingsKeyRequired' }

  const { rowCount } = await pool.query('DELETE FROM app_settings WHERE key_name = $1', [key])
  if ((rowCount ?? 0) === 0) {
    return { done: true, error: 'settingNoOverride' }
  }
  await logAudit(actor.id, 'settings.delete', 'app_settings', key, {})
  revalidatePath('/dashboard/settings', 'page')
  return { done: true }
}