import Link from 'next/link'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { MdCalendarMonth, MdChevronLeft, MdEmail, MdHome, MdPhone } from 'react-icons/md'
import { auth } from '@/lib/auth'
import { getProfileGaps } from '@/lib/profile'
import { ProfileForm } from '@/components/profile-form'

export const metadata: Metadata = {
  title: 'حسابي | Coozy Games',
}

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/login/')
  }

  if (getProfileGaps(session.user).length > 0) {
    redirect('/complete/')
  }

  const { user } = session
  const initial = (user.name ?? '؟').charAt(0)

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-3 sm:gap-8 sm:p-5">
      <nav aria-label="مسار التنقل" className="flex items-center gap-1 text-sm font-semibold text-mist-50">
        <Link href="/" className="flex items-center gap-1 transition hover:text-white">
          <MdHome size={16} />
          الرئيسية
        </Link>
        <MdChevronLeft size={16} />
        <span className="text-white">حسابي</span>
      </nav>

      <div className="flex flex-col gap-4 rounded-2xl border border-night-60 bg-night-80 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6842ff,#22d3ee)] text-3xl font-extrabold text-white sm:h-24 sm:w-24">
          {initial}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="truncate text-xl font-extrabold text-white sm:text-2xl">{user.name}</h1>
          <p className="flex items-center gap-2 text-sm font-semibold text-mist-50" dir="ltr">
            <MdEmail size={16} className="shrink-0" />
            <span className="truncate">{user.email}</span>
          </p>
          {user.phoneNumber && (
            <p className="flex items-center gap-2 text-sm font-semibold text-mist-50" dir="ltr">
              <MdPhone size={16} className="shrink-0" />
              <span>{user.phoneNumber}</span>
            </p>
          )}
          <p className="flex items-center gap-2 text-sm font-semibold text-mist-50">
            <MdCalendarMonth size={16} className="shrink-0" />
            عضو منذ {new Date(user.createdAt).getFullYear()}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-night-60 bg-night-80 p-5 sm:p-8">
        <ProfileForm initialName={user.name ?? ''} />
      </div>
    </div>
  )
}
