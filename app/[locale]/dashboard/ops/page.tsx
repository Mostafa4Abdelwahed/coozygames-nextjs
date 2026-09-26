import { notFound } from 'next/navigation'
import {
  HardDrive,
  CircleCheck,
  CircleX,
  FileArchive,
  FileImage,
  ImageIcon,
  Server,
  Database,
  Layers,
  FolderOpen,
} from 'lucide-react'
import {
  checkWispHealth,
  getDbStats,
  getImageCacheStats,
  getWispHealthUrl,
  IMAGE_CACHE_DIR,
} from '@/lib/dashboard/ops'
import { OpsPurger } from '@/components/dashboard/ops-purger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getTranslations } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

export default async function OpsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const t = await getTranslations({ locale, namespace: 'Dashboard.ops' })

  const [cache, db, wisp, wispUrl] = await Promise.all([
    getImageCacheStats(),
    getDbStats(),
    checkWispHealth(),
    getWispHealthUrl(),
  ])

  const cacheCards = [
    { labelKey: 'filesTotal', value: cache.files.toLocaleString('en-US'), icon: HardDrive },
    { labelKey: 'totalSize', value: cache.sizePretty, icon: FileArchive },
    { labelKey: 'originalFiles', value: cache.originals.toLocaleString('en-US'), icon: ImageIcon },
    { labelKey: 'convertedCopies', value: cache.variants.toLocaleString('en-US'), icon: FileImage },
    { labelKey: 'largerThan1mb', value: cache.largeFiles.toLocaleString('en-US'), icon: Layers },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('title')}</h1>
        <p className="text-sm font-medium text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Server className="size-4" />
              </span>
              {t('wispCardTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            {wisp.ok ? (
              <span className="flex size-10 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
                <CircleCheck className="size-5" />
              </span>
            ) : (
              <span className="flex size-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                <CircleX className="size-5" />
              </span>
            )}
            <div className="grid gap-0.5">
              <span className={`text-lg font-semibold ${wisp.ok ? 'text-emerald-600' : 'text-destructive'}`}>
                {wisp.ok ? t('wispConnected') : t('wispDisconnected')}
              </span>
              <span className="text-xs font-medium text-muted-foreground" dir="ltr">
                {wispUrl}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {wisp.detail ?? ''}
                {wisp.ok ? ` — ${wisp.ms}ms` : ''}
              </span>
            </div>
          </CardContent>
        </Card>

        <OpsPurger />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cacheCards.map(({ labelKey, value, icon: Icon }) => (
          <Card key={labelKey}>
            <CardHeader className="px-4 pt-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-0.5 px-4 pb-4">
              <span className="text-xl font-bold tracking-tight">{value}</span>
              <span className="text-xs font-medium text-muted-foreground">{t(labelKey)}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {cache.largest.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="size-4 text-primary" />
              {t('largestFiles')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {cache.largest.map((f) => (
              <div key={f.name} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-foreground" dir="ltr" title={f.name}>
                  {f.name}
                </span>
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">{f.sizePretty}</span>
              </div>
            ))}
            <p className="mt-1 text-xs font-medium text-muted-foreground" dir="ltr">
              {IMAGE_CACHE_DIR}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-4 text-primary" />
            {t('sectionDb')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {[
              { labelKey: 'eventsPlays', value: db.playEvents.toLocaleString('en-US') },
              { labelKey: 'auditLogs', value: db.auditLogs.toLocaleString('en-US') },
              { labelKey: 'overrides', value: db.overrides.toLocaleString('en-US') },
            ].map(({ labelKey, value }) => (
              <div key={labelKey} className="rounded-lg bg-muted/50 p-3">
                <div className="text-lg font-semibold text-foreground">{value}</div>
                <div className="text-xs font-medium text-muted-foreground">{t(labelKey)}</div>
              </div>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t('tableHeader')}</TableHead>
                <TableHead className="text-end">{t('sizeHeader')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {db.tables.map((t_row) => (
                <TableRow key={t_row.name}>
                  <TableCell className="font-medium" dir="ltr">
                    {t_row.name}
                  </TableCell>
                  <TableCell className="text-end text-muted-foreground">
                    <Badge variant="secondary">{t_row.sizePretty}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}