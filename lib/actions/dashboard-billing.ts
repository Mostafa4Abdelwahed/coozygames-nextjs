'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db'
import { requireAdmin } from '@/lib/dashboard/admin'
import { logAudit } from '@/lib/dashboard/audit'
import { SUBSCRIPTION_DAYS } from '@/lib/billing'

export type BillingActionState = { done: boolean; error?: string }

/** Persist the monthly price into app_settings (single source for /premium). */
export async function saveMonthlyPrice(
  _state: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const actor = await requireAdmin()
  const raw = String(formData.get('price') ?? '').trim()
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 1 || value > 999999) {
    return { done: true, error: 'invalidPrice' }
  }
  await pool.query(
    `INSERT INTO app_settings (key_name, value, is_secret)
     VALUES ('PREMIUM_MONTHLY_PRICE', $1, false)
     ON CONFLICT (key_name)
     DO UPDATE SET value = EXCLUDED.value, is_secret = false, updated_at = now()`,
    [String(value)],
  )
  await logAudit(actor.id, 'billing.price.set', 'app_settings', 'PREMIUM_MONTHLY_PRICE', { value })
  revalidatePath('/dashboard/billing', 'page')
  return { done: true }
}

/** Review a pending payment: approve (extends subscription) or reject. */
export async function reviewPayment(
  _state: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const actor = await requireAdmin()
  const paymentId = String(formData.get('paymentId') ?? '')
  const decision = String(formData.get('decision') ?? '') as 'approve' | 'reject'
  const note = String(formData.get('adminNote') ?? '').trim().slice(0, 300)

  if (!paymentId) return { done: true, error: 'paymentNotFound' }
  if (decision !== 'approve' && decision !== 'reject') return { done: true, error: 'invalidDecision' }

  const status = decision === 'approve' ? 'approved' : 'rejected'
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const updated = await client.query<{ user_id: string }>(
      `UPDATE payments
         SET status = $2, admin_note = $3, reviewed_by = $4,
             reviewed_at = now(), updated_at = now()
       WHERE id = $1 AND status = 'pending'
       RETURNING user_id`,
      [paymentId, status, note || null, actor.id],
    )
    if ((updated.rowCount ?? 0) === 0) {
      await client.query('ROLLBACK')
      return { done: true, error: 'paymentAlreadyReviewed' }
    }
    if (decision === 'approve') {
      const userId = updated.rows[0].user_id
      await client.query(
        `INSERT INTO subscriptions (user_id, plan, started_at, expires_at)
         VALUES (
           $1, 'monthly',
           least(now(), COALESCE((SELECT expires_at FROM subscriptions WHERE user_id = $1), now())),
           COALESCE(
             (SELECT expires_at FROM subscriptions WHERE user_id = $1 AND expires_at > now()),
             now()
           ) + interval '${SUBSCRIPTION_DAYS} days'
         )
         ON CONFLICT (user_id) DO UPDATE SET
           started_at = EXCLUDED.started_at,
           expires_at = EXCLUDED.expires_at,
           updated_at = now()`,
        [userId],
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  await logAudit(actor.id, `billing.payment.${decision === 'approve' ? 'approve' : 'reject'}`, 'payments', paymentId, {
    note,
  })
  revalidatePath('/dashboard/billing', 'page')
  revalidatePath('/premium', 'page')
  return { done: true }
}

/** Create a new manual payment method. */
export async function addPaymentMethod(
  _state: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const actor = await requireAdmin()
  const name = String(formData.get('name') ?? '').trim()
  const details = String(formData.get('details') ?? '').trim().slice(0, 200)

  if (name.length < 2 || name.length > 40) {
    return { done: true, error: 'methodNameLength' }
  }

  try {
    await pool.query('INSERT INTO payment_methods (name, details) VALUES ($1, $2)', [name, details])
  } catch (err) {
    if ((err as { code?: string }).code === '23505') {
      return { done: true, error: 'methodDuplicate' }
    }
    throw err
  }

  await logAudit(actor.id, 'billing.method.add', 'payment_methods', name, { details })
  revalidatePath('/dashboard/billing', 'page')
  return { done: true }
}

/** Rename / update details of a payment method. */
export async function updatePaymentMethod(
  _state: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const actor = await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const details = String(formData.get('details') ?? '').trim().slice(0, 200)

  if (!id) return { done: true, error: 'methodNotFound' }
  if (name.length < 2 || name.length > 40) {
    return { done: true, error: 'methodNameLength' }
  }

  try {
    await pool.query('UPDATE payment_methods SET name = $2, details = $3, updated_at = now() WHERE id = $1', [
      id,
      name,
      details,
    ])
  } catch (err) {
    if ((err as { code?: string }).code === '23505') {
      return { done: true, error: 'methodDuplicate' }
    }
    throw err
  }
  await logAudit(actor.id, 'billing.method.update', 'payment_methods', id, { name, details })
  revalidatePath('/dashboard/billing', 'page')
  return { done: true }
}

/** Enable or disable a payment method. */
export async function togglePaymentMethod(
  _state: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const actor = await requireAdmin()
  const id = String(formData.get('id') ?? '')
  const enabled = formData.get('enabled') === '1'

  if (!id) return { done: true, error: 'methodNotFound' }

  await pool.query('UPDATE payment_methods SET enabled = $2, updated_at = now() WHERE id = $1', [id, enabled])
  await logAudit(actor.id, 'billing.method.toggle', 'payment_methods', id, { enabled })
  revalidatePath('/dashboard/billing', 'page')
  return { done: true }
}

/** Remove a payment method (rejected if payments already reference it). */
export async function deletePaymentMethod(
  _state: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const actor = await requireAdmin()
  const id = String(formData.get('id') ?? '')

  if (!id) return { done: true, error: 'methodNotFound' }

  const { rows } = await pool.query<{ n: number }>('SELECT count(*)::int AS n FROM payments WHERE method_id = $1', [id])
  if ((rows[0]?.n ?? 0) > 0) {
    return { done: true, error: 'methodHasPayments' }
  }

  await pool.query('DELETE FROM payment_methods WHERE id = $1', [id])
  await logAudit(actor.id, 'billing.method.delete', 'payment_methods', id, {})
  revalidatePath('/dashboard/billing', 'page')
  return { done: true }
}