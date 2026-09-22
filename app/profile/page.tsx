import Link from 'next/link'
import type { Metadata } from 'next'
import { MdCalendarMonth, MdChevronLeft, MdEmail, MdHome, MdLogout, MdPhone } from 'react-icons/md'
import { ProfileForm } from '@/components/profile-form'

export const metadata: Metadata = {
  title: 'حسابي | Coozy Games',
}

export default function ProfilePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-3 sm:gap-8 sm:p-5">
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
          أ
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="truncate text-xl font-extrabold text-white sm:text-2xl">لاعب كوزي</h1>
          <p className="flex items-center gap-2 text-sm font-semibold text-mist-50" dir="ltr">
            <MdEmail size={16} className="shrink-0" />
            <span className="truncate">player@coozygames.com</span>
          </p>
          <p className="flex items-center gap-2 text-sm font-semibold text-mist-50" dir="ltr">
            <MdPhone size={16} className="shrink-0" />
            <span>+20 100 123 4567</span>
          </p>
          <p className="flex items-center gap-2 text-sm font-semibold text-mist-50">
            <MdCalendarMonth size={16} className="shrink-0" />
            عضو منذ 2026
          </p>
        </div>
        <Link
          href="/login/"
          className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-[30px] bg-night-60 px-4 text-sm font-extrabold text-white transition hover:bg-night-40"
        >
          <MdLogout size={18} />
          تسجيل الخروج
        </Link>
      </div>

      <div className="rounded-2xl border border-night-60 bg-night-80 p-5 sm:p-8">
        <ProfileForm />
      </div>
    </div>
  )
}
