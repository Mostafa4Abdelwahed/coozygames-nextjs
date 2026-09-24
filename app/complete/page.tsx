import Link from 'next/link'
import type { Metadata } from 'next'
import type { ComponentType } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { MdChevronLeft, MdHome, MdLinkOff, MdPersonAdd, MdSchedule, MdWorkspacePremium } from 'react-icons/md'
import { auth } from '@/lib/auth'
import { getProfileGaps } from '@/lib/profile'
import { resolveAccessLink, type AccessLink } from '@/lib/access-links'
import { CompleteProfileForm } from '@/components/complete-profile-form'
import { ActivateLinkCard } from '@/components/access-link/activate-card'

export const metadata: Metadata = {
  title: 'استكمال البيانات | Coozy Games',
}

const GAP_LABELS: Record<string, string> = {
  name: 'الاسم',
  phoneNumber: 'رقم الهاتف',
}

type SearchParams = { token?: string }

export default async function CompletePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const token = String(sp.token ?? '').trim()
  const session = await auth.api.getSession({ headers: await headers() })

  // No token → the classic "finish your profile" page.
  if (!token) {
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

  const link = await resolveAccessLink(token)

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 p-3 sm:gap-8 sm:p-5">
      <nav aria-label="مسار التنقل" className="flex items-center gap-1 text-sm font-semibold text-mist-50">
        <Link href="/" className="flex items-center gap-1 transition hover:text-white">
          <MdHome size={16} />
          الرئيسية
        </Link>
        <MdChevronLeft size={16} />
        <span className="text-white">تفعيل الاشتراك</span>
      </nav>

      {!link && <StatusCard title="الرابط غير صالح" text="تحقق من الرابط، أو اطلب رابطًا جديدًا ممن أرسله إليك." icon={MdLinkOff} />}
      {link?.status === 'used' && (
        <StatusCard title="تم استخدام هذا الرابط بالفعل" text="كل رابط يصلح لمرة استخدام واحدة فقط. اطلب رابطًا جديدًا لتفعيل اشتراكك." icon={MdLinkOff} />
      )}
      {link?.status === 'expired' && (
        <StatusCard title="انتهت صلاحية هذا الرابط" text="هذا الرابط تجاوز مدته. اطلب ممن أرسله إليك رابطًا جديدًا." icon={MdSchedule} />
      )}

      {link && (link.status === 'active') && !session && (
        <SignInGate subscriptionDays={link.subscriptionDays} next={`/complete/?token=${encodeURIComponent(token)}`} />
      )}

      {link?.status === 'active' && session && <ActiveLinkFlow link={link} token={token} session={session.user} />}
    </div>
  )
}

function StatusCard({
  title,
  text,
  icon: Icon,
}: {
  title: string
  text: string
  icon: ComponentType<{ size?: number; className?: string }>
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-night-60 bg-night-80 p-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-night-60 text-mist-50">
        <Icon size={32} />
      </span>
      <h1 className="text-xl font-extrabold text-white sm:text-2xl">{title}</h1>
      <p className="max-w-sm text-sm font-semibold text-mist-50">{text}</p>
      <Link
        href="/"
        className="mt-1 flex h-12 w-full items-center justify-center rounded-[30px] bg-night-60 text-base font-extrabold text-white transition hover:bg-night-40 sm:w-64"
      >
        العودة للرئيسية
      </Link>
    </div>
  )
}

function SignInGate({ subscriptionDays, next }: { subscriptionDays: number; next: string }) {
  return (
    <div className="rounded-2xl border border-night-60 bg-night-80 p-5 sm:p-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-night-60 text-brand-60">
          <MdWorkspacePremium size={24} />
        </span>
        <div>
          <h1 className="text-xl font-extrabold text-white sm:text-2xl">عرض اشتراك مميز 🎁</h1>
          <p className="mt-0.5 text-sm font-semibold text-mist-50">استمتع بـ {subscriptionDays} يوم لعب بدون حدود</p>
        </div>
      </div>
      <p className="mb-5 text-sm font-semibold text-mist-50">
        سجّل دخولك أو أنشئ حسابًا في ثوانٍ وفعّل الاشتراك — الرابط بيُحرق بعد التفعيل ومش هيشتغل تاني.
      </p>
      <div className="flex flex-col gap-3">
        <Link
          href={`/login/?next=${encodeURIComponent(next)}`}
          className="flex h-12 w-full items-center justify-center rounded-[30px] bg-brand-100 text-base font-extrabold text-white transition hover:bg-brand-80 active:opacity-70"
        >
          تسجيل الدخول
        </Link>
        <Link
          href={`/register/?next=${encodeURIComponent(next)}`}
          className="flex h-12 w-full items-center justify-center rounded-[30px] bg-night-60 text-base font-extrabold text-white transition hover:bg-night-40 active:opacity-70"
        >
          إنشاء حساب جديد
        </Link>
      </div>
    </div>
  )
}

function ActiveLinkFlow({ link, token, session }: { link: AccessLink; token: string; session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>['user'] }) {
  const gaps = getProfileGaps(session)

  if (gaps.length > 0) {
    return (
      <div className="rounded-2xl border border-night-60 bg-night-80 p-5 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-night-60 text-brand-60">
            <MdPersonAdd size={24} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-white sm:text-2xl">أكّد بياناتك أولًا</h1>
            <p className="mt-0.5 text-sm font-semibold text-mist-50">
              عشان نفعّل اشتراكك، ناقصك: {gaps.map((g) => GAP_LABELS[g]).join('، ')}
            </p>
          </div>
        </div>
        <CompleteProfileForm
          missing={gaps}
          currentName={session.name ?? ''}
          redirectTo={`/complete/?token=${encodeURIComponent(token)}`}
        />
      </div>
    )
  }

  return (
    <ActivateLinkCard token={token} subscriptionDays={link.subscriptionDays} />
  )
}