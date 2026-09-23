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
  IMAGE_CACHE_DIR,
} from '@/lib/dashboard/ops'
import { OpsPurger } from '@/components/dashboard/ops-purger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function OpsPage() {
  const [cache, db, wisp] = await Promise.all([getImageCacheStats(), getDbStats(), checkWispHealth()])

  const cacheCards = [
    { label: 'Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ù„ÙØ§Øª', value: cache.files.toLocaleString('en-US'), icon: HardDrive },
    { label: 'Ø§Ù„Ø­Ø¬Ù… Ø§Ù„ÙƒÙ„ÙŠ', value: cache.sizePretty, icon: FileArchive },
    { label: 'Ù…Ù„ÙØ§Øª Ø£ØµÙ„ÙŠØ©', value: cache.originals.toLocaleString('en-US'), icon: ImageIcon },
    { label: 'Ù†Ø³Ø® Ù…Ø­ÙˆÙ‘Ù„Ø©', value: cache.variants.toLocaleString('en-US'), icon: FileImage },
    { label: 'Ø£ÙƒØ¨Ø± Ù…Ù† 1MB', value: cache.largeFiles.toLocaleString('en-US'), icon: Layers },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Ù…Ø±Ø§Ù‚Ø¨Ø© Ø§Ù„ØªØ´ØºÙŠÙ„</h1>
        <p className="text-sm font-medium text-muted-foreground">Ø­Ø§Ù„Ø© Ø§Ù„Ù†Ø¸Ø§Ù… ÙˆØ§Ù„ÙƒØ§Ø´ ÙˆÙ‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Server className="size-4" />
              </span>
              Ø³ÙŠØ±ÙØ± Wisp (Ø§Ù„Ø¨Ø±ÙˆÙØ§ÙŠÙ„)
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
                {wisp.ok ? 'Ù…ØªØµÙ„' : 'ØºÙŠØ± Ù…ØªØµÙ„'}
              </span>
              <span className="text-xs font-medium text-muted-foreground" dir="ltr">
                {process.env.WISP_HEALTH_URL || 'http://wisp:8081/health'}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                {wisp.detail ?? ''}
                {wisp.ok ? ` â€” ${wisp.ms}ms` : ''}
              </span>
            </div>
          </CardContent>
        </Card>

        <OpsPurger />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cacheCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="px-4 pt-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-0.5 px-4 pb-4">
              <span className="text-xl font-bold tracking-tight">{value}</span>
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {cache.largest.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="size-4 text-primary" />
              Ø£ÙƒØ¨Ø± Ù…Ù„ÙØ§Øª Ø§Ù„ÙƒØ§Ø´
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
            Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {[
              { label: 'Ø£Ø­Ø¯Ø§Ø« Ø§Ù„Ù„Ø¹Ø¨', value: db.playEvents.toLocaleString('en-US') },
              { label: 'Ø³Ø¬Ù„ Ø§Ù„ØªØ¯Ù‚ÙŠÙ‚', value: db.auditLogs.toLocaleString('en-US') },
              { label: 'ØªØ¬Ø§ÙˆØ²Ø§Øª Ø§Ù„ÙƒØªØ§Ù„ÙˆØ¬', value: db.overrides.toLocaleString('en-US') },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-muted/50 p-3">
                <div className="text-lg font-semibold text-foreground">{value}</div>
                <div className="text-xs font-medium text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Ø§Ù„Ø¬Ø¯ÙˆÙ„</TableHead>
                <TableHead className="text-end">Ø§Ù„Ø­Ø¬Ù…</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {db.tables.map((t) => (
                <TableRow key={t.name}>
                  <TableCell className="font-medium" dir="ltr">
                    {t.name}
                  </TableCell>
                  <TableCell className="text-end text-muted-foreground">
                    <Badge variant="secondary">{t.sizePretty}</Badge>
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