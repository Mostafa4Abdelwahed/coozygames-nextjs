import { MdReceiptLong } from 'react-icons/md'
import { getMyPayments, formatMoney, type PaymentRecord, type PaymentStatus } from '@/lib/billing'
import { AccountSection } from './account-section'
import { getTranslations } from 'next-intl/server'

const df = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })

function formatDate(d: Date | null): string {
  return d ? df.format(d) : ''
}

const STATUS_META: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: 'pending', className: 'bg-amber-500/15 text-amber-400' },
  approved: { label: 'approved', className: 'bg-emerald-500/15 text-emerald-400' },
  rejected: { label: 'rejected', className: 'bg-red-500/15 text-red-400' },
}

type Translator = Awaited<ReturnType<typeof getTranslations>>;

function StatusBadge({ status, t }: { status: PaymentStatus; t: Translator }) {
  const meta = STATUS_META[status];
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${meta.className}`}>{t(`status.${meta.label}`)}</span>
  )
}

export async function PremiumHistory({ userId, title, locale }: { userId: string; title?: string; locale: string }) {
  const t = await getTranslations({ locale, namespace: 'Premium' });
  if (!userId) return null;
  const history = await getMyPayments(userId);
  if (history.length === 0) return null;

  return (
    <AccountSection icon={<MdReceiptLong className="size-5" />} title={title ?? t('subscriptionHistory')}>
      <div className="overflow-hidden rounded-2xl border border-night-60 bg-night-80">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-night-60 text-xs font-bold text-mist-50">
                <th className="px-4 py-3 text-start">{t('dateHeader')}</th>
                <th className="px-4 py-3 text-start">{t('methodHeader')}</th>
                <th className="px-4 py-3 text-start">{t('txIdHeader')}</th>
                <th className="px-4 py-3 text-start">{t('amountHeader')}</th>
                <th className="px-4 py-3 text-start">{t('statusHeader')}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((p) => (
                <PaymentRow key={p.id} payment={p} t={t} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AccountSection>
  )
}

function PaymentRow({ payment: p, t }: { payment: PaymentRecord; t: Translator }) {
  return (
    <tr className="border-b border-night-60/50 last:border-0">
      <td className="whitespace-nowrap px-4 py-3 text-mist-50">{formatDate(p.createdAt)}</td>
      <td className="px-4 py-3 font-semibold text-white">{p.methodName}</td>
      <td className="px-4 py-3 text-mist-50" dir="ltr">
        {p.providerTransactionId}
      </td>
      <td className="px-4 py-3 font-semibold text-white">{formatMoney(p.amount, p.currency)}</td>
      <td className="px-4 py-3">
        <StatusBadge status={p.status} t={t} />
      </td>
    </tr>
  )
}