import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getProfileGaps } from '@/lib/profile'

const OPEN_PATHS = ['/login', '/register', '/complete']

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next()
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  // Anonymous visitors can browse public pages freely
  if (!session) {
    return NextResponse.next()
  }

  // Logged-in users with missing profile data must complete it first,
  // except on /dashboard where the layout enforces admin access.
  const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/')
  if (!isDashboard && getProfileGaps(session.user).length > 0) {
    return NextResponse.redirect(new URL('/complete/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
