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
        setResult({ done: true, error: data?.error ?? 'فشل التنظيف' })
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
      setResult({ done: true, error: 'تعذر الاتصال بالخادم' })
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
          تنظيف كاش الصور
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          يحذف نسخ التحويل المشتقّة (variants) الأقدم من ساعة واحدة فقط — الأصلية لا
          تُمسّ، والنسخ المحذوفة تُعاد إنشاؤها تلقائيًا عند الحاجة.
        </p>

        {result.done &&
          (result.error ? (
            <Alert variant="destructive">
              <CircleX className="size-4" />
              <AlertTitle>فشل</AlertTitle>
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CircleCheck className="size-4 text-emerald-400" />
              <AlertTitle className="text-emerald-400">تم</AlertTitle>
              <AlertDescription>
                حُذف {result.deleted?.toLocaleString('en-US') ?? 0} ملف
                {result.deleted ? ` (${formatBytes(result.freedBytes ?? 0)})` : ''}
                {result.errors && result.errors.length > 0
                  ? ` — فشل ${result.errors.length}`
                  : ''}
              </AlertDescription>
            </Alert>
          ))}

        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" className="gap-2" />}>
            <TriangleAlert className="size-4" />
            تنظيف الكاش
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>متأكد من تنظيف الكاش؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف كل نسخ التحويل الأقدم من ساعة. لا يمكن التراجع، لكنها تتحمّل
                تلقائيًا عند طلب الصور مجددًا.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                className="gap-2"
                disabled={running}
                onClick={() => void run()}
              >
                <Trash2 className="size-4" />
                {running ? 'جارٍ التنظيف...' : 'تنظيف'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}