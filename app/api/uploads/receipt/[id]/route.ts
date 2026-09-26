import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { pool } from '@/lib/db'
import { auth } from '@/lib/auth'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Serves a stored payment receipt image to its owner or an admin.
 * Never reachable publicly: the media is kept in Postgres, not public/.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id || !UUID_RE.test(id)) return new NextResponse('Not Found', { status: 404 })

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const { rows } = await pool.query<{
    user_id: string
    receipt_image: Buffer | null
    receipt_image_type: string | null
  }>('SELECT user_id, receipt_image, receipt_image_type FROM payments WHERE id = $1', [id])

  const row = rows[0]
  if (!row) return new NextResponse('Not Found', { status: 404 })

  const isAdmin = session.user.role === 'admin'
  if (!isAdmin && row.user_id !== session.user.id) return new NextResponse('Forbidden', { status: 403 })

  if (!row.receipt_image || !row.receipt_image_type) return new NextResponse('Not Found', { status: 404 })

  return new NextResponse(new Uint8Array(row.receipt_image), {
    headers: {
      'Content-Type': row.receipt_image_type,
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Cache-Control': 'private, max-age=3600',
      'Content-Length': String(row.receipt_image.length),
    },
  })
}