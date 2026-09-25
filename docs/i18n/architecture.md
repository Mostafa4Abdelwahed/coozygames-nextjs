# Architecture — i18n

## 1. نظرة عامة

نستخدم **next-intl** بمعمارية prefix-based routing: كل صفحة تنتقل تحت segment ديناميكي
`app/[locale]/`، والقواميس JSON تُحمَّل في السيرفر فقط (لا وزن على الـ client bundle إلا
للـ messages اللازمة للكومبوننتس الـ Client عبر `NextIntlClientProvider`).

```
الطلب /games
  → proxy.ts (next-intl) يعمل locale negotiation من الـ URL ثم الكوكي ثم Accept-Language
  → redirect إلى /ar/games أو /en/games
  → app/[locale]/layout.tsx يحدد <html lang dir>
  → الصفحة تقرأ الترجمة عبر useTranslations / getTranslations
```

## 2. الراوتنج

### الإعداد المركزي — `i18n/routing.ts`

```ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'always',
})
```

### بنية الملفات (مقترحة)

```
i18n/
  routing.ts          # defineRouting
  request.ts          # getRequestConfig (next/root-params)
  navigation.ts       # createNavigation → Link, redirect, usePathname, useRouter, getPathname
messages/
  ar.json             # القاموس العربي
  en.json             # القاموس الإنجليزي
app/
  layout.tsx          # ⚠️ يُحذف/يُنقل — الـ root layout يصبح app/[locale]/layout.tsx
  [locale]/
    layout.tsx        # root layout: <html lang dir> + NextIntlClientProvider + SiteShell
    page.tsx
    games/page.tsx
    game/[slug]/page.tsx
    game-category/[slug]/page.tsx
    login/page.tsx
    register/page.tsx
    complete/page.tsx
    profile/page.tsx
    premium/page.tsx
    play/[slug]/page.tsx
    dashboard/...      # تُنقل للاتساق، النصوص تبقى عربي
  api/                # تبقى خارج [locale] (بدون prefix)
  image/[...path]/    # تبقى خارج [locale]
  manifest.ts         # تبقى خارج [locale]
proxy.ts              # يُدمج فيه next-intl middleware مع منطق auth الحالي
next.config.ts        # يُلفّ بـ createNextIntlPlugin()
```

> **ملاحظة:** `app/api`, `app/image`, وملفات الجذر (`manifest.ts`, `favicon.ico`, `apple-icon.png`)
> تبقى خارج `[locale]`، ومستثناة في `matcher`، وبالتالي لا تحتاج prefix.

### `generateStaticParams`

- `app/[locale]/layout.tsx` → `routing.locales.map(locale => ({ locale }))`.
- `app/[locale]/game/[slug]/page.tsx` → لكل locale × `allGameSlugs()`.
- `app/[locale]/game-category/[slug]/page.tsx` → لكل locale × التصنيفات.

> استخدام `next/root-params` (متاح في Next.js 16.3+) يعني أن الصفحات مؤهّلة للتوليد
> الساكن تلقائيًا بدون `setRequestLocale` legacy.

## 3. إعداد الطلب — `i18n/request.ts`

```ts
import * as rootParams from 'next/root-params'
import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const paramValue = await rootParams.locale()
    if (hasLocale(routing.locales, paramValue)) locale = paramValue
    else notFound()
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
```

## 4. دمج الـ proxy مع الحماية الحالية

`proxy.ts` الحالي يحمي المسارات (auth + profile gaps). الدمج:

```ts
import createMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { routing } from '@/i18n/routing'
import { auth } from '@/lib/auth'
import { getProfileGaps } from '@/lib/profile'

const intlMiddleware = createMiddleware(routing)
const OPEN_PATHS = ['/login', '/register', '/complete']
const LOCALE_RE = /^\/(ar|en)(?=\/|$)/

function stripLocale(pathname: string) {
  return pathname.replace(LOCALE_RE, '') || '/'
}

export async function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request)

  const path = stripLocale(request.nextUrl.pathname)
  if (OPEN_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return intlResponse

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return intlResponse

  const isDashboard = path === '/dashboard' || path.startsWith('/dashboard/')
  if (!isDashboard && getProfileGaps(session.user).length > 0) {
    return NextResponse.redirect(new URL('/complete/', request.url))
  }
  return intlResponse
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|image|_vercel|.*\\..*).*)'],
}
```

نقاط مهمة:

- `matcher` يستثني `image` (route handler للصور) و`_vercel` وأي ملف فيه نقطة
  (`favicon.ico`, `manifest.webmanifest`, `sw.js`, `register-sw.js`, `scramjet-init.js`, `/icons/*`).
- `stripLocale` قبل فحص `OPEN_PATHS` و`/dashboard`.
- redirect البروفايل يفضّل أن يكون واعيًا للغة (بديل: `/ar/complete/`).

## 5. التنقّل (Navigation)

كل روابط Next الداخلية تتحول من `next/link` و`next/navigation` إلى wrappers
`@/i18n/navigation` حتى يضاف prefix اللغة تلقائيًا:

```ts
// i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
```

الملفات المتأثرة (أمثلة): `components/site-shell.tsx`, `components/auth-area.tsx`,
`components/search-overlay.tsx`, `components/premium-*.tsx`, `components/pager.tsx`,
`components/dashboard/shell.tsx`, وكل الصفحات التي فيها `href`/`redirect`/`router.push`.

## 6. القواميس والمجموعات (Namespaces)

`messages/ar.json` و`messages/en.json` بنفس المفاتيح:

| Namespace | يغطي |
|---|---|
| `Common` | نصوص عامة (عرض الكل، لعب، تحميل...) |
| `Nav` | الهيدر + الـ sidebar + `SIDEBAR_TOP` |
| `Home` | عناوين صفوف الرئيسية |
| `Games` | صفحة `/games` + التابات (رائجة/جديد/محدّثة) |
| `Game` | صفحة اللعبة (مسار التنقل، مشابهة) |
| `Search` | `search-overlay` (placeholder، رائجة، لا نتائج) |
| `Pager` | أزرار الترقيم |
| `Auth` | login/register/complete |
| `Account` | profile + `auth-area` |
| `Premium` | premium + subscription gate + history |
| `Metadata` | عناوين الصفحات |
| `Errors` | رسائل الـ Server Actions |

**التصنيفات:** إضافة خريطة `EN_LABELS` في `lib/category-meta.ts` بجانب `AR_LABELS`،
وتحويل `SIDEBAR_TOP` إلى مفاتيح تُترجم من `Nav`.

## 7. RTL / LTR

- `<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>` في `app/[locale]/layout.tsx`.
- معظم الـ layout يعتمد Tailwind logical props (`ps-`, `pe-`, `me-`, `ms-`, `inset-s-`)
  فينقلب تلقائيًا.
- مراجعة يدوية للعناصر الثابتة الاتجاه:
  - أيقونات الأسهم (`MdChevronLeft`) في مسار التنقل والـ search → تُختار حسب الاتجاه.
  - `max-sm:rtl:translate-x-full` في `site-shell.tsx` يبقى شغال (Tailwind `rtl:` variant).
  - `dir="ltr"` الصريحة على الأرقام/الإيميلات/التوكنات تبقى كما هي.
- الخط `Cairo` يدعم اللاتيني — لا تغيير.

## 8. الميتاداتا والـ Manifest

- `generateMetadata` في كل صفحة عبر `getTranslations({ locale, namespace: 'Metadata' })`.
- `app/manifest.ts` يبقى عربي كافتراضي (أو يُضاف `en` لاحقًا إذا لزم).
- next-intl يضيف `alternates`/hreflang تلقائيًا عبر الـ middleware.

## 9. مبدّل اللغة (Language Switcher)

- كومبوننت عميل في الهيدر (جنب `AuthArea`): زر كرة أرضية + قائمة `العربية` / `English`.
- التبديل: `router.replace(pathname, { locale: nextLocale })` من `@/i18n/navigation`
  (يحافظ على نفس الصفحة والـ query).

## 10. Server Actions

- next-intl يدعم `getTranslations()` داخل Server Actions (الـ locale متاح من الطلب).
- رسائل الأخطاء والنجاح في `login/register/complete/profile/premium` تُترجم عبر `Errors`.
- قيم الـ `next` param في login/register تُبنى واعية باللغة لتفادي redirect مزدوج.
