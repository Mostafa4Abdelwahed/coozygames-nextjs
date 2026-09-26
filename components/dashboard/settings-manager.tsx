'use client'

import { useState, type ReactNode } from 'react'
import { useActionState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  TriangleAlert,
  KeyRound,
  FileKey,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  deleteSetting,
  saveSetting,
  type SettingActionState,
} from '@/lib/actions/dashboard-settings'
import type { SettingView } from '@/lib/dashboard/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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

const initState: SettingActionState = { done: false }

function safeTranslate(t: (key: string) => string, key?: string): string | null {
  if (!key) return null
  try {
    return t(key as Parameters<typeof t>[0])
  } catch {
    return key
  }
}

function Msg({
  state,
  success,
  tActions,
}: {
  state: SettingActionState
  success: string
  tActions: (key: string) => string
}) {
  return state.done ? (
    <p className={`text-xs font-medium ${state.error ? 'text-destructive' : 'text-emerald-600'}`}>
      {safeTranslate(tActions, state.error) ?? success}
    </p>
  ) : null
}

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 16).replace('T', ' ') : '—'
}

type SecretCheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  id: string
  label: string
}

function SecretCheckbox({ checked, onChange, id, label }: SecretCheckboxProps) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(next) => onChange(Boolean(next))} />
      <Label htmlFor={id} className="text-muted-foreground">
        {label}
      </Label>
      <input type="hidden" name="isSecret" value={checked ? '1' : ''} />
    </div>
  )
}

type EditorProps = {
  defaultKey: string
  allowKeyChange: boolean
  defaultValue: string
  isSecret: boolean
  revealable: boolean
  title: string
  description: string
  confirmLabel: string
  trigger: ReactNode
}

function SettingEditor({
  defaultKey,
  allowKeyChange,
  defaultValue,
  isSecret,
  revealable,
  title,
  description,
  confirmLabel,
  trigger,
}: EditorProps) {
  const [key, setKey] = useState(defaultKey)
  const [value, setValue] = useState(defaultValue)
  const [secret, setSecret] = useState(isSecret)
  const [reveal, setReveal] = useState(false)
  const [open, setOpen] = useState(false)
  const [state, action, saving] = useActionState(saveSetting, initState)
  const t = useTranslations('Dashboard.settings')
  const tActions = useTranslations('Dashboard.actions')

  const showEye = secret && revealable
  const valueType = showEye && !reveal ? 'password' : 'text'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form action={action} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`key-${defaultKey}`} className="text-muted-foreground">
              {t('key')}
            </Label>
            {allowKeyChange ? (
              <Input
                id={`key-${defaultKey}`}
                name="key"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                dir="ltr"
                placeholder="WISP_HEALTH_URL"
                autoComplete="off"
              />
            ) : (
              <input type="hidden" name="key" value={key} />
            )}
            {!allowKeyChange && (
              <Badge variant="secondary" className="w-fit font-mono" dir="ltr">
                {key}
              </Badge>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`value-${defaultKey}`} className="text-muted-foreground">
              {t('value')}
            </Label>
            <div className="relative">
              <Input
                id={`value-${defaultKey}`}
                name="value"
                type={valueType}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                dir="ltr"
                autoComplete="off"
              />
              {showEye && (
                <button
                  type="button"
                  onClick={() => setReveal((r) => !r)}
                  aria-label={reveal ? t('hideValue') : t('showValue')}
                  className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              )}
            </div>
          </div>

          <SecretCheckbox
            id={`secret-${defaultKey}`}
            checked={secret}
            onChange={setSecret}
            label={t('secret')}
          />

          <Msg state={state} success={t('saved')} tActions={tActions} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SettingDeleter({ settingKey }: { settingKey: string }) {
  const [state, action, deleting] = useActionState(deleteSetting, initState)
  const [open, setOpen] = useState(false)
  const t = useTranslations('Dashboard.settings')
  const tActions = useTranslations('Dashboard.actions')

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label={t('deleteAria')}
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('confirmDeleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('confirmDeleteMessage', { key: settingKey })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form action={action}>
          <input type="hidden" name="key" value={settingKey} />
          <Msg state={state} success={t('deleted')} tActions={tActions} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction type="submit" disabled={deleting} className="gap-2">
              <Trash2 className="size-4" />
              {deleting ? t('deleting') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function SettingsManager({ rows }: { rows: SettingView[] }) {
  const t = useTranslations('Dashboard.settings')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end border-b pb-4">
        <SettingEditor
          defaultKey=""
          allowKeyChange
          defaultValue=""
          isSecret={false}
          revealable={false}
          title={t('addTitle')}
          description={t('addDescription')}
          confirmLabel={t('saveOverride')}
          trigger={
            <>
              <Plus className="size-3.5" />
              {t('add')}
            </>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="grid min-w-0 gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  dir="ltr"
                  className="truncate font-mono text-sm font-semibold text-foreground"
                >
                  {row.key}
                </span>
                {row.hasDb && row.hasEnv && <Badge variant="default">{t('badgeOverride')}</Badge>}
                {row.hasDb && !row.hasEnv && <Badge variant="secondary">{t('badgeCustom')}</Badge>}
                {!row.hasDb && row.hasEnv && <Badge variant="outline">{t('badgeFromEnv')}</Badge>}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="text-muted-foreground">{row.label}</span>
                {row.updatedAt && (
                  <span dir="ltr" className="text-muted-foreground">
                    — {formatDate(row.updatedAt)}
                  </span>
                )}
              </div>
              <div className="mt-1 flex min-w-0 items-center gap-2">
                {row.isSecret ? (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <KeyRound className="size-3.5" />
                    ••••••••
                  </span>
                ) : row.value ? (
                  <span
                    dir="ltr"
                    className="truncate font-mono text-xs text-foreground"
                    title={row.value}
                  >
                    {row.value}
                  </span>
                ) : (
                  <Badge variant="outline" className="w-fit">
                    {t('noValue')}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              {!row.hasDb ? (
                <SettingEditor
                  defaultKey={row.key}
                  allowKeyChange={false}
                  defaultValue={row.value}
                  isSecret={row.isSecret}
                  revealable={row.isSecret && row.hasDb}
                  title={t('overrideTitle')}
                  description={`${t('currentValue')}: ${
                    row.isSecret ? t('currentValueSecret') : row.value || t('unset')
                  }.`}
                  confirmLabel={t('saveOverrideConfirm')}
                  trigger={
                    <>
                      <FileKey className="size-3.5" />
                      {t('saveOverride')}
                    </>
                  }
                />
              ) : (
                <>
                  <SettingEditor
                    defaultKey={row.key}
                    allowKeyChange={false}
                    defaultValue={row.value}
                    isSecret={row.isSecret}
                    revealable={row.isSecret && row.hasDb}
                    title={t('editTitle')}
                    description={t('editDescription')}
                    confirmLabel={t('save')}
                    trigger={
                      <>
                        <Pencil className="size-3.5" />
                        {t('edit')}
                      </>
                    }
                  />
                  <SettingDeleter settingKey={row.key} />
                </>
              )}
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-10 text-center text-muted-foreground">
            <TriangleAlert className="size-6" />
            <p className="text-sm font-medium">{t('empty')}</p>
          </div>
        )}
      </div>
    </div>
  )
}