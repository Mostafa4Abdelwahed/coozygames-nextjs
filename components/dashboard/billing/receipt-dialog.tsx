'use client'

import { useActionState, useState } from 'react'
import { Check, Eye, X } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { PaymentRecord } from '@/lib/billing'
import { reviewPayment, type BillingActionState } from '@/lib/actions/dashboard-billing'
import { formatMoney } from '@/lib/money'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const initState: BillingActionState = { done: false }

const STATUS_VARIANT: Record<PaymentRecord['status'], 'default' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
}

export function ReceiptDialog({ payment }: { payment: PaymentRecord }) {
  const [state, formAction, pending] = useActionState(reviewPayment, initState)
  const [note, setNote] = useState('')
  const t = useTranslations('Dashboard.billing')
  const tStatus = useTranslations('Dashboard.status')
  const tActions = useTranslations('Dashboard.actions')

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Eye className="size-3.5" />
            {t('view')}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('reviewTitle')}</DialogTitle>
          <DialogDescription dir="ltr" className="text-xs">
            {payment.id}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {payment.receiptImageType ? (
            <div className="relative h-64 w-full overflow-hidden rounded-lg border bg-muted">
              <Image
                src={`/api/uploads/receipt/${payment.id}`}
                alt={t('noImage')}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          ) : (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              {t('noImage')}
            </p>
          )}

          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">{t('amount')}</dt>
              <dd className="font-semibold">{formatMoney(payment.amount, payment.currency)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('method')}</dt>
              <dd className="font-semibold">{payment.methodName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('sender')}</dt>
              <dd>{payment.senderName}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('txId')}</dt>
              <dd dir="ltr" className="truncate">
                {payment.providerTransactionId}
              </dd>
            </div>
            {payment.recipientNote && (
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">{t('userNote')}</dt>
                <dd>{payment.recipientNote}</dd>
              </div>
            )}
            {payment.adminNote && (
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">{t('adminNote')}</dt>
                <dd>{payment.adminNote}</dd>
              </div>
            )}
            <div className="col-span-2">
              <dt className="text-xs text-muted-foreground">{t('status')}</dt>
              <dd className="pt-1">
                <Badge variant={STATUS_VARIANT[payment.status]}>{tStatus(payment.status)}</Badge>
              </dd>
            </div>
          </dl>

          {payment.status === 'pending' && (
            <form action={formAction} className="grid gap-3 rounded-xl border bg-muted/40 p-3">
              <input type="hidden" name="paymentId" value={payment.id} />
              <div>
                <Label htmlFor={`note-${payment.id}`} className="text-muted-foreground">
                  {t('adminNotePlaceholder')}
                </Label>
                <input
                  id={`note-${payment.id}`}
                  name="adminNote"
                  className="mt-1 h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={300}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button type="submit" name="decision" value="reject" variant="outline" disabled={pending} className="gap-1.5 text-destructive hover:text-destructive">
                  <X className="size-3.5" />
                  {t('reject')}
                </Button>
                <Button type="submit" name="decision" value="approve" disabled={pending} className="gap-1.5">
                  <Check className="size-3.5" />
                  {t('approve')}
                </Button>
              </div>
              {state.done && (
                <p className={`text-xs font-medium ${state.error ? 'text-destructive' : 'text-emerald-600'}`}>
                  {state.error
                    ? (() => {
                        try {
                          return tActions(state.error as Parameters<typeof tActions>[0])
                        } catch {
                          return state.error
                        }
                      })()
                    : t('reviewSuccess')}
                </p>
              )}
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}