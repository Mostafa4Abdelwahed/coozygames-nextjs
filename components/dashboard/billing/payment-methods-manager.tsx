'use client'

import { useEffect, useState, useActionState } from 'react'
import { Pencil, Plus, Trash2, WalletCards } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { PaymentMethod } from '@/lib/billing'
import {
  addPaymentMethod,
  deletePaymentMethod,
  togglePaymentMethod,
  updatePaymentMethod,
  type BillingActionState,
} from '@/lib/actions/dashboard-billing'
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

function Msg({ state, success, tActions }: { state: BillingActionState; success: string; tActions: (k: string) => string }) {
  return state.done ? (
    <p className={`text-xs font-medium ${state.error ? 'text-destructive' : 'text-emerald-600'}`}>
      {state.error
        ? (() => {
            try {
              return tActions(state.error as Parameters<typeof tActions>[0])
            } catch {
              return state.error
            }
          })()
        : success}
    </p>
  ) : null
}

function ToggleMethod({ id, enabled }: { id: string; enabled: boolean }) {
  const [, action, pending] = useActionState(togglePaymentMethod, initState)
  const t = useTranslations('Dashboard.billing')
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
        {enabled ? t('disableMethod') : t('enableMethod')}
      </Button>
    </form>
  )
}

function DeleteMethod({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deletePaymentMethod, initState)
  const t = useTranslations('Dashboard.billing')
  const tActions = useTranslations('Dashboard.actions')
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <Button
        size="sm"
        variant="ghost"
        type="submit"
        disabled={pending}
        className="text-destructive hover:text-destructive"
        title={state.error ? safeAct(tActions, state.error) : t('deleteMethod')}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </form>
  )
}

function safeAct(tActions: (k: string) => string, key: string) {
  try {
    return tActions(key as Parameters<typeof tActions>[0])
  } catch {
    return key
  }
}

function AddMethodForm({ onClose }: { onClose: () => void }) {
  const [state, action, pending] = useActionState(addPaymentMethod, initState)
  const t = useTranslations('Dashboard.billing')
  const tActions = useTranslations('Dashboard.actions')

  useEffect(() => {
    if (state.done && !state.error) onClose()
  }, [state, onClose])

  return (
    <form action={action} className="grid gap-4">
      <div>
        <Label htmlFor="nm-name" className="text-muted-foreground">
          {t('methodName')}
        </Label>
        <Input
          id="nm-name"
          name="name"
          placeholder={t('methodNamePlaceholder')}
          required
          autoFocus
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="nm-details" className="text-muted-foreground">
          {t('methodDetails')}
        </Label>
        <Input
          id="nm-details"
          name="details"
          placeholder={t('methodDetailsPlaceholder')}
          className="mt-1"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <DialogClose render={<Button variant="outline">{t('cancel')}</Button>} />
        <Button type="submit" disabled={pending} className="gap-1.5">
          <Plus className="size-3.5" />
          {t('addMethod')}
        </Button>
      </div>
      <Msg state={state} success={t('methodAdded')} tActions={tActions} />
    </form>
  )
}

export function PaymentMethodsManager({ methods }: { methods: PaymentMethod[] }) {
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<PaymentMethod | null>(null)
  const [editState, editAction, editPending] = useActionState(updatePaymentMethod, initState)
  const t = useTranslations('Dashboard.billing')
  const tActions = useTranslations('Dashboard.actions')

  const enabledCount = methods.filter((m) => m.enabled).length

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          {methods.length > 0 && t('enabledCount', { enabled: enabledCount, total: methods.length })}
        </p>
        <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="size-3.5" />
          {t('addMethod')}
        </Button>
      </div>

      {methods.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t('noMethodsEmpty')}
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
                <Badge variant={m.enabled ? 'default' : 'outline'}>
                  {m.enabled ? t('methodEnabled') : t('methodDisabled')}
                </Badge>
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
                {t('editMethod')}
              </Button>
              <DeleteMethod id={m.id} />
            </div>
          </div>
        ))
      )}

      <Dialog open={addOpen} onOpenChange={(open) => !open && setAddOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('addMethodTitle')}</DialogTitle>
            <DialogDescription>{t('addMethodDescription')}</DialogDescription>
          </DialogHeader>
          <AddMethodForm onClose={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editMethodTitle')}</DialogTitle>
          </DialogHeader>
          <form action={editAction} className="grid gap-3">
            <input type="hidden" name="id" value={editing?.id ?? ''} />
            <div>
              <Label htmlFor="me-name" className="text-muted-foreground">
                {t('methodName')}
              </Label>
              <Input id="me-name" name="name" defaultValue={editing?.name} required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="me-details" className="text-muted-foreground">
                {t('methodDetails')}
              </Label>
              <Input
                id="me-details"
                name="details"
                defaultValue={editing?.details ?? ''}
                placeholder={t('methodDetailsPlaceholder')}
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <DialogClose render={<Button variant="outline">{t('cancel')}</Button>} />
              <Button type="submit" disabled={editPending}>
                {t('saveEdits')}
              </Button>
            </div>
            <Msg state={editState} success={t('editSaved')} tActions={tActions} />
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}