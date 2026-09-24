import { MdWorkspacePremium } from 'react-icons/md'
import { formatMoney, type SubscriptionState } from '@/lib/billing'

const df = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })

export function PremiumStatusCard({ state, price }: { state: SubscriptionState; price: number }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-night-60 bg-night-80 p-5 sm:p-6">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#6842ff,#22d3ee)] text-white">
        <MdWorkspacePremium size={24} />
      </span>
      <p className="min-w-0 flex-1 text-sm font-semibold leading-relaxed text-mist-50">
        {state.active ? (
          <>
            اشتراكك نشط{' '}
            <span className="font-extrabold text-emerald-400">حتى {df.format(state.expiresAt!)}</span> — يتبقى{' '}
            {state.daysLeft} يوم{state.daysLeft === 1 ? '' : 'ًا'} لعب بدون حدود.
          </>
        ) : state.pendingPaymentCount ? (
          'لديك دفعة قيد المراجعة بانتظار تأكيد الأدمن.'
        ) : (
          <>
            اشترك بـ <span className="font-extrabold text-white">{formatMoney(price, 'EGP')}</span> / شهر لفتح اللعب
            كاملًا.
          </>
        )}
      </p>
    </div>
  )
}