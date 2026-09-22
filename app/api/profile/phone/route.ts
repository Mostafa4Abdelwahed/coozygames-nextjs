import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import { normalizePhoneNumber } from '@/lib/phone'

/**
 * Directly sets the logged-in user's phone number (no OTP for now).
 * Validates format server-side and enforces uniqueness (excluding self).
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return NextResponse.json({ message: 'غير مسجل الدخول' }, { status: 401 })
  }

  const { phoneNumber } = (await request.json()) as { phoneNumber?: string }
  const full = normalizePhoneNumber((phoneNumber ?? '').trim())

  if (!full) {
    return NextResponse.json({ message: 'رقم الهاتف غير صحيح' }, { status: 400 })
  }

  const taken = await pool.query('SELECT 1 FROM "user" WHERE "phoneNumber" = $1 AND id <> $2 LIMIT 1', [
    full,
    session.user.id,
  ])
  if ((taken.rowCount ?? 0) > 0) {
    return NextResponse.json({ message: 'هذا الرقم مسجل بالفعل' }, { status: 409 })
  }

  await pool.query('UPDATE "user" SET "phoneNumber" = $1, "updatedAt" = NOW() WHERE id = $2', [full, session.user.id])

  return NextResponse.json({ ok: true })
}
