'use client'

import { useState } from 'react'
import { Pencil, RotateCcw } from 'lucide-react'
import {
  clearGameOverride,
  upsertGameOverride,
  type OverrideState,
} from '@/lib/actions/dashboard-games'
import type { GameOverride } from '@/lib/dashboard/overrides'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Alert, AlertDescription } from '@/components/ui/alert'

export type OverrideInitial = Pick<GameOverride, 'hidden' | 'featured' | 'sortWeight' | 'titleAr' | 'thumb'>

const initState: OverrideState = { done: false }

function ErrorMessage({ state }: { state: OverrideState }) {
  if (!state.error) return null
  return (
    <Alert variant="destructive">
      <AlertDescription>{state.error}</AlertDescription>
    </Alert>
  )
}

export function GameOverrideForm({ slug, initial }: { slug: string; initial: OverrideInitial }) {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(initial.hidden)
  const [featured, setFeatured] = useState(initial.featured)
  const [state, setState] = useState<OverrideState>(initState)
  const [clearState, setClearState] = useState<OverrideState>(initState)
  const [saving, setSaving] = useState(false)
  const [clearing, setClearing] = useState(false)

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setState(initState)
    const result = await upsertGameOverride(initState, new FormData(e.currentTarget))
    setState(result)
    setSaving(false)
    if (result.done && !result.error) setOpen(false)
  }

  async function handleClear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setClearing(true)
    setClearState(initState)
    const result = await clearGameOverride(initState, new FormData(e.currentTarget))
    setClearState(result)
    setClearing(false)
    if (result.done && !result.error) setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="secondary" size="sm" className="gap-1.5 w-full" />}>
        <Pencil className="size-3.5" />
        تعديل العرض
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تعديل عرض اللعبة</DialogTitle>
          <DialogDescription dir="ltr" className="text-xs">
            {slug}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="grid gap-4">
          <input type="hidden" name="slug" value={slug} />

          <div className="grid gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`hidden-${slug}`}
                checked={hidden}
                onCheckedChange={(checked) => setHidden(Boolean(checked))}
              />
              <Label htmlFor={`hidden-${slug}`} className="text-foreground">
                إخفاء اللعبة
              </Label>
              <input type="hidden" name="hidden" value={hidden ? 'on' : ''} />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id={`featured-${slug}`}
                checked={featured}
                onCheckedChange={(checked) => setFeatured(Boolean(checked))}
              />
              <Label htmlFor={`featured-${slug}`} className="text-foreground">
                تمييز (أول القائمة)
              </Label>
              <input type="hidden" name="featured" value={featured ? 'on' : ''} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`weight-${slug}`} className="text-muted-foreground">
              وزن الترتيب (تنازلي)
            </Label>
            <Input
              id={`weight-${slug}`}
              type="number"
              name="sortWeight"
              defaultValue={initial.sortWeight}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`title-${slug}`} className="text-muted-foreground">
              عنوان عربي
            </Label>
            <Input
              id={`title-${slug}`}
              type="text"
              name="titleAr"
              defaultValue={initial.titleAr ?? ''}
              placeholder="يُترك فارغًا لاستخدام العنوان الأصلي"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`thumb-${slug}`} className="text-muted-foreground">
              صورة مصغّرة (تبدأ بـ /image/)
            </Label>
            <Input
              id={`thumb-${slug}`}
              type="text"
              name="thumb"
              defaultValue={initial.thumb ?? ''}
              placeholder="/image/..."
              dir="ltr"
            />
          </div>

          <ErrorMessage state={state} />

          <Button type="submit" disabled={saving}>
            {saving ? 'جارٍ الحفظ...' : 'حفظ'}
          </Button>
        </form>

        <form onSubmit={handleClear} className="border-t pt-4">
          <input type="hidden" name="slug" value={slug} />
          <ErrorMessage state={clearState} />
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            className="w-full gap-1.5"
            disabled={clearing}
          >
            <RotateCcw className="size-3.5" />
            {clearing ? 'جارٍ الإزالة...' : 'إعادة تعيين (حذف الـ override)'}
          </Button>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}