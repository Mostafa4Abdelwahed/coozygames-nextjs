'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { ShieldCheck, Ban, Unlock, LogOut, UserRoundCog } from 'lucide-react'
import {
  banUser,
  revokeUserSessions,
  setUserRole,
  unbanUser,
  type UserActionState,
} from '@/app/dashboard/users/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

const initState: UserActionState = { done: false }

const ROLE_SELECT_STYLE =
  'h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm whitespace-nowrap outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50'

function Msg({ state, success }: { state: UserActionState; success: string }) {
  return state.done ? (
    <p
      className={`text-xs font-medium ${state.error ? 'text-destructive' : 'text-emerald-400'}`}
    >
      {state.error ?? success}
    </p>
  ) : null
}

export function UserManager({
  userId,
  role,
  banned,
  isSelf,
}: {
  userId: string
  role: string | null
  banned: boolean
  isSelf: boolean
}) {
  const [open, setOpen] = useState(false)
  const [roleState, roleAction, roleSaving] = useActionState(setUserRole, initState)
  const [unbanState, unbanAction, unbanSaving] = useActionState(unbanUser, initState)
  const [banState, banAction, banSaving] = useActionState(banUser, initState)
  const [revokeState, revokeAction, revokeSaving] = useActionState(revokeUserSessions, initState)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <UserRoundCog className="size-3.5" />
        إدارة
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>إدارة الحساب</DialogTitle>
          <DialogDescription dir="ltr" className="text-xs">
            {userId}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <form action={roleAction} className="grid gap-2">
            <input type="hidden" name="userId" value={userId} />
            <Label htmlFor={`role-${userId}`} className="text-muted-foreground">
              الدور
            </Label>
            <div className="flex items-end gap-2">
              <select
                id={`role-${userId}`}
                name="role"
                defaultValue={role ?? 'user'}
                disabled={isSelf}
                className={`${ROLE_SELECT_STYLE} flex-1`}
              >
                <option value="user">مستخدم</option>
                <option value="admin">أدمن</option>
              </select>
              <Button type="submit" size="sm" disabled={roleSaving || isSelf}>
                <ShieldCheck className="size-3.5" />
                حفظ
              </Button>
            </div>
            <Msg state={roleState} success="تم تحديث الدور" />
            {isSelf && (
              <p className="text-xs text-muted-foreground">لا يمكنك تغيير دورك من هنا.</p>
            )}
          </form>

          <div className="h-px bg-border" />

          {banned ? (
            <form action={unbanAction} className="grid gap-2">
              <input type="hidden" name="userId" value={userId} />
              <Msg state={unbanState} success="تم فك الحظر" />
              <Button
                type="submit"
                variant="outline"
                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                disabled={unbanSaving || isSelf}
              >
                <Unlock className="size-4" />
                {unbanSaving ? 'جارٍ التنفيذ...' : 'فك الحظر'}
              </Button>
            </form>
          ) : (
            <form action={banAction} className="grid gap-2">
              <input type="hidden" name="userId" value={userId} />
              <Label htmlFor={`ban-reason-${userId}`} className="text-muted-foreground">
                سبب الحظر (اختياري)
              </Label>
              <Input
                id={`ban-reason-${userId}`}
                type="text"
                name="banReason"
                placeholder="سبب الحظر (اختياري)"
              />
              <Label htmlFor={`ban-expires-${userId}`} className="text-muted-foreground">
                مدة الحظر بالثواني (فارغة = دائم)
              </Label>
              <Input
                id={`ban-expires-${userId}`}
                type="number"
                name="banExpiresIn"
                placeholder="فارغة = دائم"
              />
              <Msg state={banState} success="تم الحظر" />
              <Button
                type="submit"
                variant="destructive"
                disabled={banSaving || isSelf}
              >
                <Ban className="size-4" />
                {banSaving ? 'جارٍ التنفيذ...' : 'حظر'}
              </Button>
            </form>
          )}

          <form action={revokeAction} className="grid gap-2">
            <input type="hidden" name="userId" value={userId} />
            <Msg state={revokeState} success="تم إنهاء كل الجلسات" />
            <Button
              type="submit"
              variant="outline"
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
              disabled={revokeSaving || isSelf}
            >
              <LogOut className="size-4" />
              {revokeSaving ? 'جارٍ التنفيذ...' : 'إنهاء كل الجلسات'}
            </Button>
          </form>

          <Badge variant={banned ? 'destructive' : isSelf ? 'secondary' : 'outline'} className="w-fit">
            {banned ? 'محظور' : isSelf ? 'أنت' : 'نشط'}
          </Badge>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}