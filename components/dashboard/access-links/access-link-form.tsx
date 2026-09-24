'use client'

import { useActionState, useState } from 'react'
import { Copy, Link2, Plus } from 'lucide-react'
import { createLink, type AccessLinksActionState } from '@/app/dashboard/access-links/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const initState: AccessLinksActionState = { done: false }

function fullLink(token: string): string {
  return `${window.location.origin}/complete/?token=${encodeURIComponent(token)}`
}

export function AccessLinkForm() {
  const [state, formAction, pending] = useActionState(createLink, initState)
  const [copied, setCopied] = useState(false)

  const link = state.token ? fullLink(state.token) : null

  async function copyLink() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable; the box is still selectable
    }
  }

  return (
    <div className="grid gap-5">
      <form action={formAction} className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="access-note">ملاحظة (اختياري)</Label>
          <Input
            id="access-note"
            name="note"
            placeholder="مثال: هدية محمد — تجربة شهر مجاني"
            maxLength={200}
            className="h-9"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="access-days">أيام الاشتراك</Label>
            <Input
              id="access-days"
              name="subscriptionDays"
              type="number"
              min={1}
              max={36500}
              step={1}
              required
              defaultValue={30}
              className="h-9"
              dir="ltr"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="access-validity">صلاحية الرابط (بالأيام)</Label>
            <Input
              id="access-validity"
              name="validityDays"
              type="number"
              min={0}
              max={36500}
              step={1}
              required
              defaultValue={7}
              className="h-9"
              dir="ltr"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          صلاحية الرابط = المدة قبل أن ينتهي الرابط غير المستخدم. استخدم 0 للصلاحية التي لا تنتهي.
        </p>

        {state.done && state.error && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {state.error}
          </p>
        )}

        <Button type="submit" size="sm" disabled={pending} className="w-fit">
          <Plus className="size-4" />
          {pending ? 'جارٍ الإنشاء...' : 'إنشاء رابط'}
        </Button>
      </form>

      {link && (
        <div className="grid gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Link2 className="size-3.5" />
              ارسل هذا الرابط للزبون — لمرة واحدة فقط
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => void copyLink()}>
              <Copy className="size-3.5" />
              {copied ? 'تم النسخ' : 'نسخ'}
            </Button>
          </div>
          <div className="break-all rounded-lg bg-background/60 px-3 py-2 text-xs font-semibold text-foreground" dir="ltr">
            {link}
          </div>
          <p className="text-[11px] text-muted-foreground">
            الرابط يُحرَق أول ما يفعّله صاحبه — ولن يظهر كاملًا مرة أخرى بعد هذا.
          </p>
        </div>
      )}
    </div>
  )
}