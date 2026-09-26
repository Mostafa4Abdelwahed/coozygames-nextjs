'use client'

import { useActionState, useState } from 'react'
import { Copy, Link2, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createLink, type AccessLinksActionState } from '@/lib/actions/dashboard-access-links'
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
  const t = useTranslations('Dashboard.accessLinks')
  const tActions = useTranslations('Dashboard.actions')

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
          <Label htmlFor="access-note">{t('note_field')}</Label>
          <Input
            id="access-note"
            name="note"
            placeholder={t('notePlaceholder')}
            maxLength={200}
            className="h-9"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="access-days">{t('subscriptionDays')}</Label>
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
            <Label htmlFor="access-validity">{t('validityDays')}</Label>
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

        <p className="text-xs text-muted-foreground">{t('validityHint')}</p>

        {state.done && state.error && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {(() => {
              try {
                return tActions(state.error as Parameters<typeof tActions>[0])
              } catch {
                return state.error
              }
            })()}
          </p>
        )}

        <Button type="submit" size="sm" disabled={pending} className="w-fit">
          <Plus className="size-4" />
          {pending ? t('sending') : t('createLink')}
        </Button>
      </form>

      {link && (
        <div className="grid gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Link2 className="size-3.5" />
              {t('sendToCustomer')}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => void copyLink()}>
              <Copy className="size-3.5" />
              {copied ? t('copied') : t('copy')}
            </Button>
          </div>
          <div className="break-all rounded-lg bg-background/60 px-3 py-2 text-xs font-semibold text-foreground" dir="ltr">
            {link}
          </div>
          <p className="text-[11px] text-muted-foreground">{t('linkBurns')}</p>
        </div>
      )}
    </div>
  )
}