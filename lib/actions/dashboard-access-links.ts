'use server'

import { revalidatePath } from 'next/cache'
import { createAccessLink, deleteAccessLink, generateAccessToken } from '@/lib/access-links'
import { requireAdmin } from '@/lib/dashboard/admin'
import { logAudit } from '@/lib/dashboard/audit'

export type AccessLinksActionState = { done: boolean; error?: string; token?: string }

const MAX_NOTE_LEN = 200

/** Create a one-time access link (note + subscription days + validity days). */
export async function createLink(
  _state: AccessLinksActionState,
  formData: FormData,
): Promise<AccessLinksActionState> {
  const actor = await requireAdmin()
  const note = String(formData.get('note') ?? '').trim().slice(0, MAX_NOTE_LEN)
  const rawDays = String(formData.get('subscriptionDays') ?? '')
  const rawValidity = String(formData.get('validityDays') ?? '')
  const days = Number(rawDays)
  const validity = Number(rawValidity)

  if (!Number.isInteger(days) || days < 1 || days > 36500) {
    return { done: true, error: 'invalidDays' }
  }
  if (!Number.isInteger(validity) || validity < 0 || validity > 36500) {
    return { done: true, error: 'invalidValidity' }
  }

  const token = generateAccessToken()
  await createAccessLink({
    token,
    note,
    subscriptionDays: days,
    validityDays: validity,
    createdBy: actor.id,
  })
  await logAudit(actor.id, 'access_links.create', 'access_links', token, {
    note,
    subscriptionDays: days,
    validityDays: validity,
  })
  revalidatePath('/dashboard/access-links', 'page')
  return { done: true, token }
}

/** Revoke a link that has not been used yet. */
export async function deleteLink(_state: AccessLinksActionState, formData: FormData): Promise<AccessLinksActionState> {
  const actor = await requireAdmin()
  const token = String(formData.get('token') ?? '').trim()
  if (!token) return { done: true, error: 'tokenRequired' }

  const existed = await deleteAccessLink(token)
  await logAudit(actor.id, 'access_links.delete', 'access_links', token, {})
  revalidatePath('/dashboard/access-links', 'page')
  return { done: true, error: existed ? undefined : 'tokenNotFound' }
}