import Link from 'next/link'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  MdAccountCircle,
  MdCalendarMonth,
  MdChevronLeft,
  MdEmail,
  MdHome,
  MdPhone,
  MdWorkspacePremium,
} from 'react-icons/md'
import { auth } from '@/lib/auth'
import { getProfileGaps } from '@/lib/profile'
import { getMonthlyPrice, getSubscriptionState } from '@/lib/billing'
import { ProfileForm } from '@/components/profile-form'
import { PremiumStatusCard } from '@/components/premium-status-card'
import { PremiumHistory } from '@/components/premium-history'
import { AccountSection } from '@/components/account-section'

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
  const [subState, price] = await Promise.all([getSubscriptionState(user.id), getMonthlyPrice()])
  const initial = (user.name ?? '؟').charAt(0)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-3 sm:gap-8 sm:p-5">
      <nav aria-label="مسار التنقل" className="flex items-center gap-1 text-sm font-semibold text-mist-50">
        <Link href="/" className="flex items-center gap-1 transition hover:text-white">
          <MdHome size={16} />
          الرئيسية
        </Link>
        <MdChevronLeft size={16} />
        <span className="text-white">حسابي</span>
      </nav>

      <header className="overflow-hidden rounded-2xl border border-night-60 bg-night-80">
        <div className="flex items-center gap-4 p-5 sm:p-6">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6842ff,#22d3ee)] text-2xl font-extrabold text-white sm:h-20 sm:w-20 sm:text-3xl">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold text-white sm:text-2xl">{user.name}</h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-mist-50" dir="ltr">
              <MdEmail className="size-4 shrink-0 text-brand-60" />
              <span className="truncate">{user.email}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-night-60 px-5 py-3 sm:px-6">
          {user.phoneNumber && (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-mist-50" dir="ltr">
              <MdPhone className="size-4 shrink-0 text-brand-60" />
              {user.phoneNumber}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-sm font-semibold text-mist-50">
            <MdCalendarMonth className="size-4 shrink-0 text-brand-60" />
            عضو منذ {new Date(user.createdAt).getFullYear()}
          </span>
        </div>
      </header>

      <AccountSection icon={<MdAccountCircle className="size-5" />} title="البيانات الشخصية">
        <div className="rounded-2xl border border-night-60 bg-night-80 p-5 sm:p-6">
          <ProfileForm initialName={user.name ?? ''} />
        </div>
      </AccountSection>

      <AccountSection
        icon={<MdWorkspacePremium className="size-5" />}
        title="الاشتراك المميز"
        action={
          <Link
            href="/premium/"
            className="flex h-10 items-center justify-center rounded-[30px] bg-brand-100 px-5 text-sm font-extrabold text-white transition hover:bg-brand-80 active:opacity-70"
          >
            {subState.active ? 'إدارة الاشتراك' : 'الاشتراك الآن'}
          </Link>
        }
      >
        <PremiumStatusCard state={subState} price={price} />
      </AccountSection>

      <PremiumHistory userId={user.id} title="الفواتير" />
    </div>
  )
}