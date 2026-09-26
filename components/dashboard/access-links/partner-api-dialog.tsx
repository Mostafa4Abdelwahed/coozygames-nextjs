'use client'

import { useState, type ReactNode } from 'react'
import { Check, Copy, KeyRound, Terminal } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type PartnerApiDialogProps = {
  endpoint: string
  partnerKey: string
  generatedAt: string | null
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const t = useTranslations('Dashboard.accessLinks')

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable; the value is still selectable
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void copy()} className="gap-1.5">
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
      {copied ? t('copied') : label}
    </Button>
  )
}

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 19).replace('T', ' ') : ''
}

export function PartnerApiDialog({ endpoint, partnerKey, generatedAt }: PartnerApiDialogProps) {
  const t = useTranslations('Dashboard.accessLinks')
  const curl = [
    `curl -X POST '${endpoint}' \\`,
    `  -H 'X-CG-Partner-Key: ${partnerKey}' \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -d '{"label":"Order #123","valid_days":7}'`,
  ].join('\n')

  const rows: { label: string; value: ReactNode }[] = [
    {
      label: t('partnerEndpoint'),
      value: (
        <span className="break-all font-mono text-xs text-foreground" dir="ltr">
          {endpoint}
        </span>
      ),
    },
    {
      label: t('partnerMethod'),
      value: <span className="font-mono text-xs text-foreground">POST</span>,
    },
    {
      label: t('partnerHeader'),
      value: (
        <span className="break-all font-mono text-xs text-foreground" dir="ltr">
          X-CG-Partner-Key: {partnerKey}
        </span>
      ),
    },
    {
      label: t('partnerBody'),
      value: <span className="text-xs text-muted-foreground">{t('partnerBodyValue')}</span>,
    },
  ]

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <KeyRound className="size-3.5" />
        {t('partnerTitle')}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary" />
            {t('partnerTitle')}
          </DialogTitle>
          <DialogDescription>{t('partnerSubtitle')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <dl className="grid gap-2 rounded-xl border p-3">
            {rows.map((row) => (
              <div key={row.label} className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:items-start sm:gap-3">
                <dt className="text-xs font-semibold text-muted-foreground">{row.label}</dt>
                <dd className="min-w-0">{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <KeyRound className="size-3.5" />
                {t('partnerKeyLabel')}
                {generatedAt && (
                  <span className="font-normal">
                    — {t('partnerKeyGenerated', { date: formatDate(generatedAt) })}
                  </span>
                )}
              </span>
              <CopyButton value={partnerKey} label={t('partnerCopyKey')} />
            </div>
            <div
              className="break-all rounded-lg bg-background/60 px-3 py-2 font-mono text-xs font-semibold text-foreground"
              dir="ltr"
            >
              {partnerKey}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Terminal className="size-3.5" />
                {t('partnerExample')}
              </span>
              <CopyButton value={curl} label={t('partnerCopyCurl')} />
            </div>
            <pre
              className="overflow-x-auto rounded-xl bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground"
              dir="ltr"
            >
              {curl}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
