import { MdWorkspacePremium } from 'react-icons/md'
import { formatMoney, type SubscriptionState } from '@/lib/billing'
import { useTranslations } from 'next-intl';

const df = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })

export function PremiumStatusCard({ state, price }: { state: SubscriptionState; price: number }) {
  const t = useTranslations("Premium");
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-night-60 bg-night-80 p-5 sm:p-6">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#6842ff,#22d3ee)] text-white">
        <MdWorkspacePremium size={24} />
      </span>
      <p className="min-w-0 flex-1 text-sm font-semibold leading-relaxed text-mist-50">
        {state.active ? (
          <>
            {t("subscriptionActive")}{' '}
            <span className="font-extrabold text-emerald-400">{t("activeUntilDate", { date: df.format(state.expiresAt!), days: state.daysLeft, plural: state.daysLeft === 1 ? '' : 's' })}</span>
          </>
        ) : state.pendingPaymentCount ? (
          t("pendingReview")
        ) : (
          <>
            {t("subscribeAt", { price: formatMoney(price, 'EGP') })}
          </>
        )}
      </p>
    </div>
  )
}