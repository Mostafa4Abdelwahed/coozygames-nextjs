'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db'
import { auth } from '@/lib/auth'
import {
  getMonthlyPrice,
  listPaymentMethods,
  type PaymentMethod,
  MAX_RECEIPT_BYTES,
  ALLOWED_RECEIPT_TYPES,
} from '@/lib/billing'

export type PaymentActionState = { done: boolean; error?: string }

const MAX_TXN_LEN = 64
const MAX_SENDER_LEN = 64
const MAX_NOTE_LEN = 300

const TXN_RE = /^[\w\p{L}\p{N}.\-/ ]{4,64}$/u

/** Client submits a manual payment (receipt image + transaction id). */
export async function submitPayment(
  _state: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { done: true, error: 'سجّل الدخول أولًا' }

  const methodId = String(formData.get('methodId') ?? '')
  const txId = String(formData.get('providerTransactionId') ?? '').trim().slice(0, MAX_TXN_LEN)
  const sender = String(formData.get('senderName') ?? '').trim().slice(0, MAX_SENDER_LEN)
  const note = String(formData.get('recipientNote') ?? '').trim().slice(0, MAX_NOTE_LEN)
  const file = formData.get('receiptImage')

  if (!TXN_RE.test(txId)) {
    return { done: true, error: 'رقم العملية مطلوب (4 إلى 64 حرفًا)' }
  }
  if (sender.length < 2) {
    return { done: true, error: 'اسم المرسل مطلوب' }
  }

  const methods = await listPaymentMethods(false)
  const method = methods.find((m: PaymentMethod) => m.id === methodId)
  if (!method) {
    return { done: true, error: 'طريقة الدفع غير صالحة' }
  }

  if (!(file instanceof File) || file.size === 0) {
    return { done: true, error: 'صورة الإيصال مطلوبة' }
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    return { done: true, error: 'حجم الصورة أكبر من 5 م.ب' }
  }
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    return { done: true, error: 'صيغة غير مدعومة — استخدم JPG أو PNG أو WebP' }
  }

  const image = Buffer.from(await file.arrayBuffer())
  const imageType = file.type.trim() || 'application/octet-stream'

  const amount = await getMonthlyPrice()

  await pool.query(
    `INSERT INTO payments
       (user_id, method_id, amount, currency, provider_transaction_id, sender_name, recipient_note, receipt_image, receipt_image_type)
     VALUES ($1, $2, $3, 'EGP', $4, $5, $6, $7, $8)`,
    [session.user.id, method.id, amount, txId, sender, note, image, imageType],
  )

  revalidatePath('/premium', 'page')
  return { done: true }
}