import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { normalizePhoneNumber } from '@/lib/phone'

/**
 * Pre-signup uniqueness check for email and phone number.
 * The database UNIQUE constraints remain the final guarantee
 * (race-safe); this endpoint only provides friendly field errors.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')?.trim() ?? ''
  const rawPhone = searchParams.get('phoneNumber')?.trim() ?? ''
  // Normalize so "010..." and "+2010..." hit the same stored E.164 value
  const phoneNumber = rawPhone ? (normalizePhoneNumber(rawPhone) ?? rawPhone) : ''

  let emailTaken = false
  let phoneTaken = false

  if (email) {
    const result = await pool.query('SELECT 1 FROM "user" WHERE LOWER(email) = LOWER($1) LIMIT 1', [email])
    emailTaken = (result.rowCount ?? 0) > 0
  }

  if (phoneNumber) {
    const result = await pool.query('SELECT 1 FROM "user" WHERE "phoneNumber" = $1 LIMIT 1', [phoneNumber])
    phoneTaken = (result.rowCount ?? 0) > 0
  }

  return NextResponse.json({ emailTaken, phoneTaken })
}
