import { MdReceiptLong } from 'react-icons/md'
import { getMyPayments, formatMoney, type PaymentRecord, type PaymentStatus } from '@/lib/billing'
import { AccountSection } from './account-section'

const df = new Intl.DateTimeFormat('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })

function formatDate(d: Date | null): string {
  return d ? df.format(d) : ''
}

const STATUS_META: Record<PaymentStatus, { label: string; className: string }> = {
  pending: { label: 'قيد المراجعة', className: 'bg-amber-500/15 text-amber-400' },
  approved: { label: 'تم التأكيد', className: 'bg-emerald-500/15 text-emerald-400' },
  rejected: { label: 'مرفوض', className: 'bg-red-500/15 text-red-400' },
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const meta = STATUS_META[status]
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${meta.className}`}>{meta.label}</span>
  )
}

export async function PremiumHistory({ userId, title }: { userId: string; title?: string }) {
  if (!userId) return null
  const history = await getMyPayments(userId)
  if (history.length === 0) return null

  return (
    <AccountSection icon={<MdReceiptLong className="size-5" />} title={title ?? 'سجل الدفعات'}>
      <div className="overflow-hidden rounded-2xl border border-night-60 bg-night-80">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-night-60 text-xs font-bold text-mist-50">
                <th className="px-4 py-3 text-start">التاريخ</th>
                <th className="px-4 py-3 text-start">الطريقة</th>
                <th className="px-4 py-3 text-start">رقم العملية</th>
                <th className="px-4 py-3 text-start">المبلغ</th>
                <th className="px-4 py-3 text-start">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {history.map((p) => (
                <PaymentRow key={p.id} payment={p} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AccountSection>
  )
}

function PaymentRow({ payment: p }: { payment: PaymentRecord }) {
  return (
    <tr className="border-b border-night-60/50 last:border-0">
      <td className="whitespace-nowrap px-4 py-3 text-mist-50">{formatDate(p.createdAt)}</td>
      <td className="px-4 py-3 font-semibold text-white">{p.methodName}</td>
      <td className="px-4 py-3 text-mist-50" dir="ltr">
        {p.providerTransactionId}
      </td>
      <td className="px-4 py-3 font-semibold text-white">{formatMoney(p.amount, p.currency)}</td>
      <td className="px-4 py-3">
        <StatusBadge status={p.status} />
      </td>
    </tr>
  )
}