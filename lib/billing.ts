import { pool } from '@/lib/db'
import { getSetting } from '@/lib/dashboard/settings'
export { formatMoney } from '@/lib/money'

/** Server-only helpers for the manual-subscription billing flow (docs/payments/*). */

export const DEFAULT_MONTHLY_PRICE = 100
export const SUBSCRIPTION_DAYS = 30
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024
export const ALLOWED_RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export type PaymentStatus = 'pending' | 'approved' | 'rejected'

export type PaymentMethod = {
  id: string
  name: string
  details: string
  enabled: boolean
  sortOrder: number
}

export type UserBrief = {
  userId: string
  userName: string | null
  userEmail: string
  userPhone: string | null
}

export type PaymentRecord = UserBrief & {
  id: string
  methodName: string
  amount: number
  currency: string
  providerTransactionId: string
  senderName: string
  recipientNote: string
  receiptImageType: string | null
  status: PaymentStatus
  adminNote: string | null
  reviewedByName: string | null
  reviewedAt: Date | null
  createdAt: Date
}

export type SubscriptionState = {
  active: boolean
  plan: string | null
  startedAt: Date | null
  expiresAt: Date | null
  daysLeft: number
  pendingPaymentCount: number
}

export type BillingSummary = {
  pending: number
  approvedThisMonth: number
  revenueThisMonth: number
  activeSubscribers: number
}

/** Shared row mapping for the "user brief" columns of every payment query. */
const USER_COLUMNS = `
  u.id       AS user_id,
  u.name     AS user_name,
  u.email    AS user_email,
  u."phoneNumber" AS user_phone`

function mapUserColumns(row: {
  user_id: string
  user_name: string | null
  user_email: string
  user_phone: string | null
}): UserBrief {
  return {
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    userPhone: row.user_phone,
  }
}

/** Current monthly price: app_settings override first, then a fixed fallback. */
export async function getMonthlyPrice(): Promise<number> {
  const value = await getSetting('PREMIUM_MONTHLY_PRICE')
  const n = value ? Number(value) : NaN
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MONTHLY_PRICE
}

export async function listPaymentMethods(includeDisabled = false): Promise<PaymentMethod[]> {
  const { rows } = await pool.query<{
    id: string
    name: string
    details: string
    enabled: boolean
    sort_order: number
  }>(
    `SELECT id, name, details, enabled, sort_order
     FROM payment_methods
     ${includeDisabled ? '' : 'WHERE enabled = true'}
     ORDER BY sort_order ASC, name ASC`,
  )
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    details: r.details,
    enabled: r.enabled,
    sortOrder: r.sort_order,
  }))
}

/**
 * Active flag is computed per lookup (expires_at > now()); no cron/state anywhere.
 */
export async function getSubscriptionState(userId: string): Promise<SubscriptionState> {
  const [sub, pending] = await Promise.all([
    pool.query<{ plan: string; started_at: Date; expires_at: Date }>(
      'SELECT plan, started_at, expires_at FROM subscriptions WHERE user_id = $1',
      [userId],
    ),
    pool.query<{ n: number }>(
      "SELECT count(*)::int AS n FROM payments WHERE user_id = $1 AND status = 'pending'",
      [userId],
    ),
  ])

  const row = sub.rows[0]
  const active = Boolean(row && row.expires_at.getTime() > Date.now())
  const expiresAt = row ? row.expires_at : null
  const daysLeft = active && expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)) : 0

  return {
    active,
    plan: row?.plan ?? null,
    startedAt: row?.started_at ?? null,
    expiresAt,
    daysLeft,
    pendingPaymentCount: pending.rows[0]?.n ?? 0,
  }
}

/** Fast boolean check used by the play gate. */
export async function isPremiumActive(userId: string): Promise<boolean> {
  const { rows } = await pool.query<{ active: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM subscriptions WHERE user_id = $1 AND expires_at > now()
     ) AS active`,
    [userId],
  )
  return rows[0]?.active ?? false
}

export async function getMyPayments(userId: string): Promise<PaymentRecord[]> {
  const { rows } = await pool.query<PaymentRecordRow>(
    `SELECT p.id, p.amount, p.currency, p.provider_transaction_id, p.sender_name,
            p.recipient_note, p.receipt_image_type, p.status, p.admin_note,
            p.reviewed_at, p.created_at, m.name AS method_name,
            ${USER_COLUMNS}
     FROM payments p
     JOIN "user" u ON u.id = p.user_id
     JOIN payment_methods m ON m.id = p.method_id
     WHERE p.user_id = $1
     ORDER BY p.created_at DESC
     LIMIT 20`,
    [userId],
  )
  return rows.map(mapPaymentRow)
}

type PaymentRecordRow = {
  id: string
  amount: string
  currency: string
  provider_transaction_id: string
  sender_name: string
  recipient_note: string
  receipt_image_type: string | null
  status: PaymentStatus
  admin_note: string | null
  reviewed_at: Date | null
  created_at: Date
  method_name: string
  reviewed_name?: string | null
  user_id: string
  user_name: string | null
  user_email: string
  user_phone: string | null
}

function mapPaymentRow(row: PaymentRecordRow): PaymentRecord {
  return {
    ...mapUserColumns(row),
    id: row.id,
    methodName: row.method_name,
    amount: Number(row.amount),
    currency: row.currency,
    providerTransactionId: row.provider_transaction_id,
    senderName: row.sender_name,
    recipientNote: row.recipient_note,
    receiptImageType: row.receipt_image_type,
    status: row.status,
    adminNote: row.admin_note,
    reviewedByName: null,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  }
}

/** Admin paged list of all payments + reviewer name. */
export async function listPaymentsForAdmin(
  status: 'all' | PaymentStatus,
  page: number,
  pageSize = 20,
): Promise<{ rows: PaymentRecord[]; total: number; pages: number }> {
  const parsed = page > 0 ? page : 1
  const offset = (parsed - 1) * pageSize

  const where = status === 'all' ? '' : 'WHERE p.status = $1'
  const params: unknown[] = status === 'all' ? [pageSize, offset] : [status, pageSize, offset]
  const paramIdx = (i: number) => `$${i}`

  const [list, count] = await Promise.all([
    pool.query<PaymentRecordRow>(
      `SELECT p.id, p.amount, p.currency, p.provider_transaction_id, p.sender_name,
              p.recipient_note, p.receipt_image_type, p.status, p.admin_note,
              p.reviewed_at, p.created_at, m.name AS method_name,
              r.name AS reviewed_name,
              ${USER_COLUMNS}
       FROM payments p
       JOIN "user" u ON u.id = p.user_id
       JOIN payment_methods m ON m.id = p.method_id
       LEFT JOIN "user" r ON r.id = p.reviewed_by
       ${where}
       ORDER BY (p.status = 'pending') DESC, p.created_at DESC
       LIMIT ${paramIdx(1)} OFFSET ${paramIdx(2)}`,
      params,
    ),
    pool.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM payments p ${where}`,
      status === 'all' ? [] : [status],
    ),
  ])

  const total = count.rows[0]?.n ?? 0
  const rows = list.rows.map((row) => ({
    ...mapPaymentRow(row),
    reviewedByName: row.reviewed_name ?? null,
  }))
  return { rows, total, pages: Math.max(1, Math.ceil(total / pageSize)) }
}

export async function billingSummary(): Promise<BillingSummary> {
  const { rows } = await pool.query<{
    pending: number
    approved_this_month: number
    revenue_this_month: number
    active_subscribers: number
  }>(`
    SELECT
      count(*) FILTER (WHERE status = 'pending')::int AS pending,
      count(*) FILTER (WHERE status = 'approved' AND created_at >= date_trunc('month', now()))::int AS approved_this_month,
      COALESCE(sum(amount) FILTER (WHERE status = 'approved' AND created_at >= date_trunc('month', now())), 0)::numeric AS revenue_this_month,
      (SELECT count(*)::int FROM subscriptions WHERE expires_at > now()) AS active_subscribers
    FROM payments`)

  const row = rows[0] ?? {
    pending: 0,
    approved_this_month: 0,
    revenue_this_month: '0',
    active_subscribers: 0,
  }
  return {
    pending: row.pending ?? 0,
    approvedThisMonth: row.approved_this_month ?? 0,
    revenueThisMonth: Number(row.revenue_this_month ?? 0),
    activeSubscribers: row.active_subscribers ?? 0,
  }
}