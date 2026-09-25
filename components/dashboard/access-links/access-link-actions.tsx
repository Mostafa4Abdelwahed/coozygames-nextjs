'use client'

import { useActionState, useState } from 'react'
import { Copy, Trash2 } from 'lucide-react'
import { deleteLink, type AccessLinksActionState } from '@/lib/actions/dashboard-access-links'
import { Button } from '@/components/ui/button'
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

const initState: AccessLinksActionState = { done: false }

export function AccessLinkActions({ token, used }: { token: string; used: boolean }) {
  const [copied, setCopied] = useState(false)
  const [state, formAction, pending] = useActionState(deleteLink, initState)

  const link = `${window.location.origin}/complete/?token=${encodeURIComponent(token)}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="ghost" size="icon" aria-label="نسخ الرابط" title="نسخ الرابط" onClick={() => void copyLink()}>
        <Copy className="size-4" />
      </Button>
      {!!copied && <span className="text-xs font-medium text-emerald-600">تم النسخ</span>}

      {!used && (
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="ghost" size="icon" aria-label="حذف الرابط" title="حذف الرابط" />}>
            <Trash2 className="size-4 text-destructive" />
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>حذف رابط الوصول؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيُبطَل هذا الرابط نهائيًا ويصبح غير صالح لمن استلمه. لا يمكن التراجع.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <form action={formAction}>
                <input type="hidden" name="token" value={token} />
                <AlertDialogAction type="submit" variant="destructive" disabled={pending}>
                  {pending ? 'جارٍ الحذف...' : 'حذف'}
                </AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {!!state.error && <span className="text-xs font-medium text-destructive">{state.error}</span>}
    </div>
  )
}