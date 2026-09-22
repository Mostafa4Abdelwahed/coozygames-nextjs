import Link from 'next/link'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { MdChevronLeft, MdHome, MdPersonAdd } from 'react-icons/md'
import { auth } from '@/lib/auth'
import { getProfileGaps } from '@/lib/profile'
import { CompleteProfileForm } from '@/components/complete-profile-form'

export const metadata: Metadata = {
  title: 'استكمال البيانات | Coozy Games',
}

const GAP_LABELS: Record<string, string> = {
  name: 'الاسم',
  phoneNumber: 'رقم الهاتف',
}

export default async function CompletePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/login/')
  }

  const gaps = getProfileGaps(session.user)

  if (gaps.length === 0) {
    redirect('/profile/')
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-3 sm:gap-8 sm:p-5">
      <nav aria-label="مسار التنقل" className="flex items-center gap-1 text-sm font-semibold text-mist-50">
        <Link href="/" className="flex items-center gap-1 transition hover:text-white">
          <MdHome size={16} />
          الرئيسية
        </Link>
        <MdChevronLeft size={16} />
        <span className="text-white">استكمال البيانات</span>
      </nav>

      <div className="rounded-2xl border border-night-60 bg-night-80 p-5 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-night-60 text-brand-60">
            <MdPersonAdd size={24} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-white sm:text-2xl">استكمال البيانات</h1>
            <p className="mt-0.5 text-sm font-semibold text-mist-50">
              ناقصك: {gaps.map((g) => GAP_LABELS[g]).join('، ')}
            </p>
          </div>
        </div>
        <CompleteProfileForm missing={gaps} currentName={session.user.name ?? ''} />
      </div>
    </div>
  )
}
