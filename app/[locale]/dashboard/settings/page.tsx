import { Info } from 'lucide-react'
import { listSettings } from '@/lib/dashboard/settings'
import { SettingsManager } from '@/components/dashboard/settings-manager'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default async function DashboardSettingsPage() {
  const rows = await listSettings()

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">الإعدادات</h1>
        <p className="text-sm font-medium text-muted-foreground">
          إدارة المتغيرات (env) من لوحة التحكم بدون نزول سيرفر
        </p>
      </div>

      <Alert>
        <Info className="size-4 text-primary" />
        <AlertTitle>كيف يعمل</AlertTitle>
        <AlertDescription>
          القيم تحفظ في قاعدة البيانات وتقرأ قبل الـ env الفعلي وقت التشغيل. بعض
          القيم تشتغل فورًا (مثل رابط فحص Wisp)، وقيم الإقلاع (رابط قاعدة
          البيانات / Google) تطبّق فعليًا بعد إعادة تشغيل السيرفر — وهنا تظهر
          كمرجع من الـ env الحالي.
        </AlertDescription>
      </Alert>

      <div className="overflow-hidden rounded-xl border bg-card p-1 sm:p-2">
        <SettingsManager rows={rows} />
      </div>
    </div>
  )
}