'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { requireAdmin } from '@/lib/dashboard/admin'
import { logAudit } from '@/lib/dashboard/audit'

export type UserActionState = { done: boolean; error?: string }

const ALLOWED_ROLES = ['admin', 'user']

export async function setUserRole(_state: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requireAdmin()
  const userId = String(formData.get('userId') ?? '')
  const role = String(formData.get('role') ?? '') as 'admin' | 'user'

  if (!userId) return { done: true, error: 'المستخدم غير موجود' }
  if (!ALLOWED_ROLES.includes(role)) return { done: true, error: 'الدور غير مسموح' }
  if (userId === actor.id && role !== 'admin') return { done: true, error: 'لا يمكنك إزالة صلاحية الأدمن من نفسك' }

  await auth.api.setRole({ body: { userId, role }, headers: await headers() })
  await logAudit(actor.id, 'user.set_role', 'user', userId, { role })
  revalidatePath('/dashboard/users', 'page')
  return { done: true }
}

export async function banUser(_state: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requireAdmin()
  const userId = String(formData.get('userId') ?? '')
  const banReason = String(formData.get('banReason') ?? '').trim().slice(0, 200)
  const rawExpiry = String(formData.get('banExpiresIn') ?? '')

  if (!userId) return { done: true, error: 'المستخدم غير موجود' }
  if (userId === actor.id) return { done: true, error: 'لا يمكنك حظر نفسك' }

  const banExpiresIn = rawExpiry ? Number(rawExpiry) : undefined
  if (banExpiresIn !== undefined && (!Number.isFinite(banExpiresIn) || banExpiresIn <= 0)) {
    return { done: true, error: 'مدة الحظر غير صالحة' }
  }

  await auth.api.banUser(
    { body: { userId, banReason: banReason || undefined, banExpiresIn }, headers: await headers() },
  )
  await auth.api.revokeUserSessions({ body: { userId }, headers: await headers() }).catch(() => null)
  await logAudit(actor.id, 'user.ban', 'user', userId, { banReason, banExpiresIn })
  revalidatePath('/dashboard/users', 'page')
  return { done: true }
}

export async function unbanUser(_state: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requireAdmin()
  const userId = String(formData.get('userId') ?? '')
  if (!userId) return { done: true, error: 'المستخدم غير موجود' }

  await auth.api.unbanUser({ body: { userId }, headers: await headers() })
  await logAudit(actor.id, 'user.unban', 'user', userId, {})
  revalidatePath('/dashboard/users', 'page')
  return { done: true }
}

export async function revokeUserSessions(_state: UserActionState, formData: FormData): Promise<UserActionState> {
  const actor = await requireAdmin()
  const userId = String(formData.get('userId') ?? '')
  if (!userId) return { done: true, error: 'المستخدم غير موجود' }

  await auth.api.revokeUserSessions({ body: { userId }, headers: await headers() })
  await logAudit(actor.id, 'user.revoke_sessions', 'user', userId, {})
  revalidatePath('/dashboard/users', 'page')
  return { done: true }
}