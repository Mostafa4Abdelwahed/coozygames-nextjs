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
      className={`text-xs font-medium ${state.error ? 'text-destructive' : 'text-emerald-600'}`}
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
        Ø¥Ø¯Ø§Ø±Ø©
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø­Ø³Ø§Ø¨</DialogTitle>
          <DialogDescription dir="ltr" className="text-xs">
            {userId}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <form action={roleAction} className="grid gap-2">
            <input type="hidden" name="userId" value={userId} />
            <Label htmlFor={`role-${userId}`} className="text-muted-foreground">
              Ø§Ù„Ø¯ÙˆØ±
            </Label>
            <div className="flex items-end gap-2">
              <select
                id={`role-${userId}`}
                name="role"
                defaultValue={role ?? 'user'}
                disabled={isSelf}
                className={`${ROLE_SELECT_STYLE} flex-1`}
              >
                <option value="user">Ù…Ø³ØªØ®Ø¯Ù…</option>
                <option value="admin">Ø£Ø¯Ù…Ù†</option>
              </select>
              <Button type="submit" size="sm" disabled={roleSaving || isSelf}>
                <ShieldCheck className="size-3.5" />
                Ø­ÙØ¸
              </Button>
            </div>
            <Msg state={roleState} success="ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¯ÙˆØ±" />
            {isSelf && (
              <p className="text-xs text-muted-foreground">Ù„Ø§ ÙŠÙ…ÙƒÙ†Ùƒ ØªØºÙŠÙŠØ± Ø¯ÙˆØ±Ùƒ Ù…Ù† Ù‡Ù†Ø§.</p>
            )}
          </form>

          <div className="h-px bg-border" />

          {banned ? (
            <form action={unbanAction} className="grid gap-2">
              <input type="hidden" name="userId" value={userId} />
              <Msg state={unbanState} success="ØªÙ… ÙÙƒ Ø§Ù„Ø­Ø¸Ø±" />
              <Button
                type="submit"
                variant="outline"
                className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10"
                disabled={unbanSaving || isSelf}
              >
                <Unlock className="size-4" />
                {unbanSaving ? 'Ø¬Ø§Ø±Ù Ø§Ù„ØªÙ†ÙÙŠØ°...' : 'ÙÙƒ Ø§Ù„Ø­Ø¸Ø±'}
              </Button>
            </form>
          ) : (
            <form action={banAction} className="grid gap-2">
              <input type="hidden" name="userId" value={userId} />
              <Label htmlFor={`ban-reason-${userId}`} className="text-muted-foreground">
                Ø³Ø¨Ø¨ Ø§Ù„Ø­Ø¸Ø± (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)
              </Label>
              <Input
                id={`ban-reason-${userId}`}
                type="text"
                name="banReason"
                placeholder="Ø³Ø¨Ø¨ Ø§Ù„Ø­Ø¸Ø± (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)"
              />
              <Label htmlFor={`ban-expires-${userId}`} className="text-muted-foreground">
                Ù…Ø¯Ø© Ø§Ù„Ø­Ø¸Ø± Ø¨Ø§Ù„Ø«ÙˆØ§Ù†ÙŠ (ÙØ§Ø±ØºØ© = Ø¯Ø§Ø¦Ù…)
              </Label>
              <Input
                id={`ban-expires-${userId}`}
                type="number"
                name="banExpiresIn"
                placeholder="ÙØ§Ø±ØºØ© = Ø¯Ø§Ø¦Ù…"
              />
              <Msg state={banState} success="ØªÙ… Ø§Ù„Ø­Ø¸Ø±" />
              <Button
                type="submit"
                variant="destructive"
                disabled={banSaving || isSelf}
              >
                <Ban className="size-4" />
                {banSaving ? 'Ø¬Ø§Ø±Ù Ø§Ù„ØªÙ†ÙÙŠØ°...' : 'Ø­Ø¸Ø±'}
              </Button>
            </form>
          )}

          <form action={revokeAction} className="grid gap-2">
            <input type="hidden" name="userId" value={userId} />
            <Msg state={revokeState} success="ØªÙ… Ø¥Ù†Ù‡Ø§Ø¡ ÙƒÙ„ Ø§Ù„Ø¬Ù„Ø³Ø§Øª" />
            <Button
              type="submit"
              variant="outline"
              className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
              disabled={revokeSaving || isSelf}
            >
              <LogOut className="size-4" />
              {revokeSaving ? 'Ø¬Ø§Ø±Ù Ø§Ù„ØªÙ†ÙÙŠØ°...' : 'Ø¥Ù†Ù‡Ø§Ø¡ ÙƒÙ„ Ø§Ù„Ø¬Ù„Ø³Ø§Øª'}
            </Button>
          </form>

          <Badge variant={banned ? 'destructive' : isSelf ? 'secondary' : 'outline'} className="w-fit">
            {banned ? 'Ù…Ø­Ø¸ÙˆØ±' : isSelf ? 'Ø£Ù†Øª' : 'Ù†Ø´Ø·'}
          </Badge>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Ø¥ØºÙ„Ø§Ù‚
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}