import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export type AdminUser = {
  id: string
  email: string
  name: string | null
  role: string | null
}

/** Resolve the session and require an admin. Throws on any other case. */
export async function requireAdmin(): Promise<AdminUser> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== 'admin') throw new Error('unauthorized')
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  }
}