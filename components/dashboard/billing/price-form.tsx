'use client'

import { useActionState } from 'react'
import { Tag } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { saveMonthlyPrice, type BillingActionState } from '@/lib/actions/dashboard-billing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatMoney } from '@/lib/money'

const initState: BillingActionState = { done: false }

export function PriceForm({ current, price }: { current: string; price: number }) {
  const [state, formAction, pending] = useActionState(saveMonthlyPrice, initState)
  const t = useTranslations('Dashboard.billing')
  const tActions = useTranslations('Dashboard.actions')

  return (
    <form action={formAction} className="grid gap-2">
      <Label htmlFor="monthly-price" className="flex items-center gap-2 text-muted-foreground">
        <Tag className="size-3.5" />
        {t('monthlyPrice')}
      </Label>
      <div className="flex flex-wrap items-end gap-2">
        <Input
          id="monthly-price"
          name="price"
          type="number"
          min={1}
          max={999999}
          step="0.01"
          required
          defaultValue={current}
          className="h-9 w-36"
          dir="ltr"
        />
        <span className="text-xs font-semibold text-muted-foreground">{t('currency')}</span>
        <Button type="submit" size="sm" disabled={pending} className="ms-auto">
          {t('savePrice')}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {t('currentPriceLabel')} <span className="font-semibold text-foreground">{formatMoney(price, 'EGP')}</span>
      </p>
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
            : t('priceSaved')}
        </p>
      )}
    </form>
  )
}