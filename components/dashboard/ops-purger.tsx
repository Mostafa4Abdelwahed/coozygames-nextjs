'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, TriangleAlert, CircleCheck, CircleX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { formatBytes } from '@/lib/dashboard/bytes'

type Result = {
  done: boolean
  error?: string
  deleted?: number
  freedBytes?: number
  errors?: string[]
}

export function OpsPurger() {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<Result>({ done: false })

  async function run() {
    if (running) return
    setRunning(true)
    setResult({ done: false })
    try {
      const res = await fetch('/api/admin/ops/purge-cache', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
      const data = (await res.json().catch(() => null)) as Partial<Result> | null
      if (!res.ok) {
        setResult({ done: true, error: data?.error ?? 'ÙØ´Ù„ Ø§Ù„ØªÙ†Ø¸ÙŠÙ' })
      } else {
        setResult({
          done: true,
          deleted: data?.deleted ?? 0,
          freedBytes: data?.freedBytes ?? 0,
          errors: data?.errors,
        })
        router.refresh()
      }
    } catch {
      setResult({ done: true, error: 'ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø§Ù„Ø®Ø§Ø¯Ù…' })
    }
    setRunning(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <Trash2 className="size-4" />
          </span>
          ØªÙ†Ø¸ÙŠÙ ÙƒØ§Ø´ Ø§Ù„ØµÙˆØ±
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          ÙŠØ­Ø°Ù Ù†Ø³Ø® Ø§Ù„ØªØ­ÙˆÙŠÙ„ Ø§Ù„Ù…Ø´ØªÙ‚Ù‘Ø© (variants) Ø§Ù„Ø£Ù‚Ø¯Ù… Ù…Ù† Ø³Ø§Ø¹Ø© ÙˆØ§Ø­Ø¯Ø© ÙÙ‚Ø· â€” Ø§Ù„Ø£ØµÙ„ÙŠØ© Ù„Ø§
          ØªÙÙ…Ø³Ù‘ØŒ ÙˆØ§Ù„Ù†Ø³Ø® Ø§Ù„Ù…Ø­Ø°ÙˆÙØ© ØªÙØ¹Ø§Ø¯ Ø¥Ù†Ø´Ø§Ø¤Ù‡Ø§ ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§ Ø¹Ù†Ø¯ Ø§Ù„Ø­Ø§Ø¬Ø©.
        </p>

        {result.done &&
          (result.error ? (
            <Alert variant="destructive">
              <CircleX className="size-4" />
              <AlertTitle>ÙØ´Ù„</AlertTitle>
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CircleCheck className="size-4 text-emerald-600" />
              <AlertTitle className="text-emerald-600">ØªÙ…</AlertTitle>
              <AlertDescription>
                Ø­ÙØ°Ù {result.deleted?.toLocaleString('en-US') ?? 0} Ù…Ù„Ù
                {result.deleted ? ` (${formatBytes(result.freedBytes ?? 0)})` : ''}
                {result.errors && result.errors.length > 0
                  ? ` â€” ÙØ´Ù„ ${result.errors.length}`
                  : ''}
              </AlertDescription>
            </Alert>
          ))}

        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" className="gap-2" />}>
            <TriangleAlert className="size-4" />
            ØªÙ†Ø¸ÙŠÙ Ø§Ù„ÙƒØ§Ø´
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ù…ØªØ£ÙƒØ¯ Ù…Ù† ØªÙ†Ø¸ÙŠÙ Ø§Ù„ÙƒØ§Ø´ØŸ</AlertDialogTitle>
              <AlertDialogDescription>
                Ø³ÙŠØªÙ… Ø­Ø°Ù ÙƒÙ„ Ù†Ø³Ø® Ø§Ù„ØªØ­ÙˆÙŠÙ„ Ø§Ù„Ø£Ù‚Ø¯Ù… Ù…Ù† Ø³Ø§Ø¹Ø©. Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø§Ù„ØªØ±Ø§Ø¬Ø¹ØŒ Ù„ÙƒÙ†Ù‡Ø§ ØªØªØ­Ù…Ù‘Ù„
                ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§ Ø¹Ù†Ø¯ Ø·Ù„Ø¨ Ø§Ù„ØµÙˆØ± Ù…Ø¬Ø¯Ø¯Ù‹Ø§.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Ø¥Ù„ØºØ§Ø¡</AlertDialogCancel>
              <AlertDialogAction
                className="gap-2"
                disabled={running}
                onClick={() => void run()}
              >
                <Trash2 className="size-4" />
                {running ? 'Ø¬Ø§Ø±Ù Ø§Ù„ØªÙ†Ø¸ÙŠÙ...' : 'ØªÙ†Ø¸ÙŠÙ'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}