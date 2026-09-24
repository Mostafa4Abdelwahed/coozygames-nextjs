'use client'

import { useEffect, useState, useActionState } from 'react'
import { Pencil, Plus, Trash2, WalletCards } from 'lucide-react'
import type { PaymentMethod } from '@/lib/billing'
import {
  addPaymentMethod,
  deletePaymentMethod,
  togglePaymentMethod,
  updatePaymentMethod,
  type BillingActionState,
} from '@/app/dashboard/billing/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const initState: BillingActionState = { done: false }

function Msg({ state, success }: { state: BillingActionState; success: string }) {
  return state.done ? (
    <p className={`text-xs font-medium ${state.error ? 'text-destructive' : 'text-emerald-600'}`}>
      {state.error ?? success}
    </p>
  ) : null
}

function ToggleMethod({ id, enabled }: { id: string; enabled: boolean }) {
  const [, action, pending] = useActionState(togglePaymentMethod, initState)
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="enabled" value={enabled ? '0' : '1'} />
      <Button
        size="sm"
        variant={enabled ? 'ghost' : 'outline'}
        type="submit"
        disabled={pending}
        className="text-xs"
      >
        {enabled ? 'تعطيل' : 'تفعيل'}
      </Button>
    </form>
  )
}

function DeleteMethod({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deletePaymentMethod, initState)
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <Button
        size="sm"
        variant="ghost"
        type="submit"
        disabled={pending}
        className="text-destructive hover:text-destructive"
        title={state.error ?? 'حذف'}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </form>
  )
}

function AddMethodForm({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(addPaymentMethod, initState)

  useEffect(() => {
    if (state.done && !state.error) onClose()
  }, [state, onClose])

  return (
    <form action={action} className="grid gap-4">
      <div>
        <Label htmlFor="nm-name" className="text-muted-foreground">
          اسم الطريقة
        </Label>
        <Input id="nm-name" name="name" placeholder="مثال: فوري" required autoFocus className="mt-1" />
      </div>
      <div>
        <Label htmlFor="nm-details" className="text-muted-foreground">
          بيانات القبض (رقم + الاسم)
        </Label>
        <Input id="nm-details" name="details" placeholder="رقم المحفظة / الحساب + اسم صاحبه" className="mt-1" />
      </div>
      <div className="flex items-center justify-end gap-2">
        <DialogClose render={<Button variant="outline">إلغاء</Button>} />
        <Button type="submit" disabled={pending} className="gap-1.5">
          <Plus className="size-3.5" />
          إضافة الطريقة
        </Button>
      </div>
      <Msg state={state} success="تمت إضافة الطريقة" />
    </form>
  )
}

export function PaymentMethodsManager({ methods }: { methods: PaymentMethod[] }) {
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<PaymentMethod | null>(null)
  const [editState, editAction, editPending] = useActionState(updatePaymentMethod, initState)

  const enabledCount = methods.filter((m) => m.enabled).length

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          {methods.length > 0 && `${enabledCount} مفعلة من أصل ${methods.length}`}
        </p>
        <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="size-3.5" />
          إضافة طريقة
        </Button>
      </div>

      {methods.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          لا توجد طرق دفع بعد — اضغط «إضافة طريقة» لتشغيل الدفع اليدوي.
        </p>
      ) : (
        methods.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-xl border p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <WalletCards className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{m.name}</span>
                <Badge variant={m.enabled ? 'default' : 'outline'}>{m.enabled ? 'مفعلة' : 'معطلة'}</Badge>
              </div>
              {m.details && (
                <p className="truncate text-xs text-muted-foreground" dir="ltr">
                  {m.details}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ToggleMethod id={m.id} enabled={m.enabled} />
              <Button size="sm" variant="outline" onClick={() => setEditing(m)} className="gap-1 text-xs">
                <Pencil className="size-3" />
                تعديل
              </Button>
              <DeleteMethod id={m.id} />
            </div>
          </div>
        ))
      )}

      <Dialog open={addOpen} onOpenChange={(open) => !open && setAddOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة طريقة دفع</DialogTitle>
            <DialogDescription>
              بيانات القبض اللي هيعرضها المستخدم عند الدفع (رقم المحفظة / الحساب + اسم صاحبه).
            </DialogDescription>
          </DialogHeader>
          <AddMethodForm onClose={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل طريقة الدفع</DialogTitle>
          </DialogHeader>
          <form action={editAction} className="grid gap-3">
            <input type="hidden" name="id" value={editing?.id ?? ''} />
            <div>
              <Label htmlFor="me-name" className="text-muted-foreground">
                الاسم
              </Label>
              <Input id="me-name" name="name" defaultValue={editing?.name} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="me-details" className="text-muted-foreground">
                بيانات القبض
              </Label>
              <Input
                id="me-details"
                name="details"
                defaultValue={editing?.details ?? ''}
                placeholder="رقم المحفظة / الحساب + اسم صاحبه"
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <DialogClose render={<Button variant="outline">إلغاء</Button>} />
              <Button type="submit" disabled={editPending}>
                حفظ التعديلات
              </Button>
            </div>
            <Msg state={editState} success="تم حفظ التعديل" />
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}