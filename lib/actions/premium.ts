"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { pool } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  getMonthlyPrice,
  listPaymentMethods,
  type PaymentMethod,
  MAX_RECEIPT_BYTES,
  ALLOWED_RECEIPT_TYPES,
} from "@/lib/billing";

export type PaymentActionState = { done: boolean; error?: string };

const MAX_TXN_LEN = 64;
const MAX_SENDER_LEN = 64;
const MAX_NOTE_LEN = 300;

const TXN_RE = /^[\w\p{L}\p{N}.\-/ ]{4,64}$/u;

/** Client submits a manual payment (receipt image + transaction id). */
export async function submitPayment(
  _state: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { done: true, error: "signInFirst" };

  const methodId = String(formData.get("methodId") ?? "");
  const txId = String(formData.get("providerTransactionId") ?? "").trim().slice(0, MAX_TXN_LEN);
  const sender = String(formData.get("senderName") ?? "").trim().slice(0, MAX_SENDER_LEN);
  const note = String(formData.get("recipientNote") ?? "").trim().slice(0, MAX_NOTE_LEN);
  const file = formData.get("receiptImage");

  if (!TXN_RE.test(txId)) {
    return { done: true, error: "txIdRequired" };
  }
  if (sender.length < 2) {
    return { done: true, error: "senderRequired" };
  }

  const methods = await listPaymentMethods(false);
  const method = methods.find((m: PaymentMethod) => m.id === methodId);
  if (!method) {
    return { done: true, error: "paymentMethodInvalid" };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { done: true, error: "receiptRequired" };
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    return { done: true, error: "fileTooLarge" };
  }
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    return { done: true, error: "fileTypeInvalid" };
  }

  let image: Buffer;
  try {
    const resized = sharp(Buffer.from(await file.arrayBuffer()), { failOn: "error" })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true });
    image = await resized.toBuffer();
  } catch {
    return { done: true, error: "fileNotImage" };
  }

  const amount = await getMonthlyPrice();

  await pool.query(
    `INSERT INTO payments
       (user_id, method_id, amount, currency, provider_transaction_id, sender_name, recipient_note, receipt_image, receipt_image_type)
     VALUES ($1, $2, $3, 'EGP', $4, $5, $6, $7, 'image/jpeg')`,
    [session.user.id, method.id, amount, txId, sender, note, image],
  );

  revalidatePath("/premium", "page");
  return { done: true };
}