import {
  MdAlbum,
  MdCheckCircle,
  MdCloudQueue,
  MdDashboardCustomize,
  MdErrorOutline,
  MdStorage,
  MdVideocam,
} from 'react-icons/md'
import {
  checkWispHealth,
  getDbStats,
  getImageCacheStats,
  IMAGE_CACHE_DIR,
} from '@/lib/dashboard/ops'
import { OpsPurger } from '@/components/dashboard/ops-purger'

const CARD_STYLE = 'flex flex-col gap-1 rounded-2xl bg-night-80 p-4 sm:p-5'

export default async function OpsPage() {
  const [cache, db, wisp] = await Promise.all([getImageCacheStats(), getDbStats(), checkWispHealth()])

  const cacheCards = [
    { label: 'إجمالي الملفات', value: cache.files.toLocaleString('en-US'), icon: MdStorage },
    { label: 'الحجم الكلي', value: cache.sizePretty, icon: MdAlbum },
    { label: 'ملفات أصلية', value: cache.originals.toLocaleString('en-US'), icon: MdVideocam },
    { label: 'نسخ محوّلة', value: cache.variants.toLocaleString('en-US'), icon: MdDashboardCustomize },
    { label: 'أكبر من 1MB', value: cache.largeFiles.toLocaleString('en-US'), icon: MdCloudQueue },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-white sm:text-2xl">مراقبة التشغيل</h1>
        <p className="mt-1 text-sm font-semibold text-mist-50">حالة النظام والكاش وقاعدة البيانات</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="flex flex-col gap-2 rounded-2xl border border-night-60 bg-night-80 p-4">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-white">
            سيرفر Wisp (البروفايل)
          </h2>
          <div className="flex items-center gap-3">
            {wisp.ok ? (
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <MdCheckCircle size={22} />
              </span>
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                <MdErrorOutline size={22} />
              </span>
            )}
            <div className="flex flex-col">
              <span className={`text-lg font-extrabold ${wisp.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {wisp.ok ? 'متصل' : 'غير متصل'}
              </span>
              <span className="text-xs font-semibold text-mist-30">
                {wisp.detail ?? ''}
                {wisp.ok ? ` — ${wisp.ms}ms` : ''} · {process.env.WISP_HEALTH_URL || 'http://wisp:8081/health'}
              </span>
            </div>
          </div>
        </section>

        <OpsPurger />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cacheCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className={CARD_STYLE}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-night-60 text-brand-60">
              <Icon size={20} />
            </span>
            <span className="text-xl font-extrabold text-white">{value}</span>
            <span className="text-sm font-bold text-mist-50">{label}</span>
          </div>
        ))}
      </div>

      {cache.largest.length > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border border-night-60 bg-night-80 p-4">
          <h2 className="text-base font-extrabold text-white">أكبر ملفات الكاش</h2>
          <div className="flex flex-col gap-2">
            {cache.largest.map((f) => (
              <div key={f.name} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-bold text-white" dir="ltr" title={f.name}>
                  {f.name}
                </span>
                <span className="shrink-0 text-xs font-extrabold text-mist-50">{f.sizePretty}</span>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs font-semibold text-mist-30" dir="ltr">
            {IMAGE_CACHE_DIR}
          </p>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-night-60 bg-night-80 p-4">
        <h2 className="text-base font-extrabold text-white">قاعدة البيانات</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[
            { label: 'أحداث اللعب', value: db.playEvents.toLocaleString('en-US') },
            { label: 'سجل التدقيق', value: db.auditLogs.toLocaleString('en-US') },
            { label: 'تجاوزات الكتالوج', value: db.overrides.toLocaleString('en-US') },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-night-100 p-3">
              <div className="text-lg font-extrabold text-white">{value}</div>
              <div className="text-xs font-bold text-mist-50">{label}</div>
            </div>
          ))}
        </div>
        <div className="mt-1 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-night-60 text-start text-xs font-bold text-mist-50">
                <th className="px-3 py-2 text-start">الجدول</th>
                <th className="px-3 py-2 text-end">الحجم</th>
              </tr>
            </thead>
            <tbody>
              {db.tables.map((t) => (
                <tr key={t.name} className="border-b border-night-60/50">
                  <td className="px-3 py-2 font-bold text-white" dir="ltr">
                    {t.name}
                  </td>
                  <td className="px-3 py-2 text-end font-semibold text-mist-50">{t.sizePretty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}