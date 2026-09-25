'use client'

import { useActionState } from 'react'
import { Tag } from 'lucide-react'
import { saveMonthlyPrice, type BillingActionState } from '@/lib/actions/dashboard-billing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatMoney } from '@/lib/money'

const initState: BillingActionState = { done: false }

export function PriceForm({ current, price }: { current: string; price: number }) {
  const [state, formAction, pending] = useActionState(saveMonthlyPrice, initState)

  return (
    <form action={formAction} className="grid gap-2">
      <Label htmlFor="monthly-price" className="flex items-center gap-2 text-muted-foreground">
        <Tag className="size-3.5" />
        سعر الاشتراك الشهري
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
        <span className="text-xs font-semibold text-muted-foreground">جنيه مصري</span>
        <Button type="submit" size="sm" disabled={pending} className="ms-auto">
          حفظ السعر
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        السعر الحالي المعروض للمستخدم: <span className="font-semibold text-foreground">{formatMoney(price, 'EGP')}</span>
      </p>
      {state.done && (
        <p className={`text-xs font-medium ${state.error ? 'text-destructive' : 'text-emerald-600'}`}>
          {state.error ?? 'تم حفظ السعر — سيعمل فورًا في صفحة /premium'}
        </p>
      )}
    </form>
  )
}