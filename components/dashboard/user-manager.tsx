'use client'

import { useActionState } from 'react'
import { MdAdminPanelSettings, MdBlock, MdCheck, MdLogout, MdPerson } from 'react-icons/md'
import {
  banUser,
  revokeUserSessions,
  setUserRole,
  unbanUser,
  type UserActionState,
} from '@/app/dashboard/users/actions'

const initState: UserActionState = { done: false }

function Msg({ state, success }: { state: UserActionState; success: string }) {
  return state.done ? (
    <p className={`text-xs font-bold ${state.error ? 'text-red-400' : 'text-emerald-400'}`}>
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
  const [roleState, roleAction, roleSaving] = useActionState(setUserRole, initState)
  const [unbanState, unbanAction, unbanSaving] = useActionState(unbanUser, initState)
  const [banState, banAction, banSaving] = useActionState(banUser, initState)
  const [revokeState, revokeAction, revokeSaving] = useActionState(revokeUserSessions, initState)

  return (
    <details className="rounded-xl border border-night-60 bg-night-100">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-extrabold text-brand-60 transition hover:text-white">
        {role === 'admin' ? <MdAdminPanelSettings size={16} /> : <MdPerson size={16} />}
        إدارة الحساب
      </summary>

      <div className="flex flex-col gap-3 p-3">
        <form action={roleAction} className="flex items-end gap-2">
          <input type="hidden" name="userId" value={userId} />
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor={`role-${userId}`} className="text-xs font-bold text-mist-50">
              الدور
            </label>
            <select
              id={`role-${userId}`}
              name="role"
              defaultValue={role ?? 'user'}
              disabled={isSelf}
              className="h-9 rounded-lg border border-night-60 bg-night-80 px-2 text-sm font-semibold text-white outline-none focus:border-brand-60 disabled:opacity-50"
            >
              <option value="user">مستخدم</option>
              <option value="admin">أدمن</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={roleSaving || isSelf}
            className="h-9 rounded-lg bg-brand-100 px-4 text-sm font-extrabold text-white transition hover:bg-brand-80 disabled:opacity-50"
          >
            حفظ
          </button>
        </form>
        <Msg state={roleState} success="تم تحديث الدور" />

        {banned ? (
          <form action={unbanAction} className="flex flex-col gap-2">
            <input type="hidden" name="userId" value={userId} />
            <Msg state={unbanState} success="تم فك الحظر" />
            <button
              type="submit"
              disabled={unbanSaving || isSelf}
              className="flex h-9 items-center justify-center gap-2 rounded-lg border border-night-60 px-4 text-sm font-extrabold text-mist-50 transition hover:border-emerald-500/50 hover:text-emerald-400 disabled:opacity-50"
            >
              <MdCheck size={16} />
              {unbanSaving ? 'جارٍ التنفيذ...' : 'فك الحظر'}
            </button>
          </form>
        ) : (
          <form action={banAction} className="flex flex-col gap-2">
            <input type="hidden" name="userId" value={userId} />
            <input
              type="text"
              name="banReason"
              placeholder="سبب الحظر (اختياري)"
              className="h-9 rounded-lg border border-night-60 bg-night-80 px-2 text-sm font-semibold text-white outline-none placeholder:text-mist-30 focus:border-brand-60"
            />
            <input
              type="number"
              name="banExpiresIn"
              placeholder="مدة الحظر بالثواني (فارغة = دائم)"
              className="h-9 rounded-lg border border-night-60 bg-night-80 px-2 text-sm font-semibold text-white outline-none placeholder:text-mist-30 focus:border-brand-60"
            />
            <Msg state={banState} success="تم الحظر" />
            <button
              type="submit"
              disabled={banSaving || isSelf}
              className="flex h-9 items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 text-sm font-extrabold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <MdBlock size={16} />
              {banSaving ? 'جارٍ التنفيذ...' : 'حظر'}
            </button>
          </form>
        )}

        <form action={revokeAction} className="border-t border-night-60 pt-3">
          <input type="hidden" name="userId" value={userId} />
          <Msg state={revokeState} success="تم إنهاء كل الجلسات" />
          <button
            type="submit"
            disabled={revokeSaving || isSelf}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-night-60 px-4 text-sm font-extrabold text-mist-50 transition hover:border-amber-500/50 hover:text-amber-400 disabled:opacity-50"
          >
            <MdLogout size={16} />
            {revokeSaving ? 'جارٍ التنفيذ...' : 'إنهاء كل الجلسات'}
          </button>
        </form>
      </div>
    </details>
  )
}