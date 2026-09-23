# Architecture — Dashboard

## 1. نظرة عامة

الداشبورد جوّه **نفس تطبيق Next.js** (App Router)، بيستخدم نفس الـ Postgres ونفس
`better-auth`. مفيش مشروع منفصل. الهدف إننا نستغل البنية الموجودة:

- **قراءة البيانات** في Server Components مباشرة عبر `lib/db` (`pool`).
- **التعديلات** عبر Server Actions أو Route Handlers تحت `/api/admin/*` مع تحقق صلاحية.
- **الواجهة** عربي RTL بنفس ثيم Tailwind (`night`/`brand`/`mist`) ونفس `react-icons`.

## 2. المسارات

| المسار | النوع | الوصف |
|---|---|---|
| `/dashboard` | Server | نظرة عامة + عدّادات ورسوم |
| `/dashboard/users` | Server + Client | قائمة المستخدمين + أدوات الإدارة |
| `/dashboard/games` | Server + Client | الكتالوج + إدارة الـ overrides |
| `/dashboard/analytics` | Server | تحليلات اللعب (`play_events`) |
| `/dashboard/ops` | Server + Client | كاش الصور + حالة Wisp + عدّادات DB |

> كل المسارات دي تحت `app/dashboard/` ومحمية في الـ `layout.tsx`.

## 3. الشِل والـ Layout

```
app/dashboard/layout.tsx          # Server: فحص الأدمن + شِل الإدارة (sidebar/topbar)
app/dashboard/page.tsx            # نظرة عامة
app/dashboard/users/page.tsx
app/dashboard/games/page.tsx
app/dashboard/analytics/page.tsx
app/dashboard/ops/page.tsx
components/dashboard/*            # مكوّنات الإدارة (tables, cards, forms)
lib/dashboard/queries.ts          # استعلامات القراءة (server-only)
lib/dashboard/overrides.ts        # منطق دمج الـ overrides مع الكتالوج
```

### فحص الأدمن (Server)

```ts
// app/dashboard/layout.tsx (مبدئي)
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function DashboardLayout({ children }: LayoutProps<'/dashboard'>) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login/')
  if (session.user.role !== 'admin') redirect('/')
  return <DashboardShell user={session.user}>{children}</DashboardShell>
}
```

### تعديلات مطلوبة على الموجود

1. **`components/site-shell.tsx`**: يتجاهل `/dashboard` زي ما بيعمل مع `/play`:
   ```ts
   if (pathname?.startsWith('/play') || pathname?.startsWith('/dashboard')) return <>{children}</>
   ```
2. **`proxy.ts` (middleware)**: حاليًا بيحوّل أي مستخدم ناقص البروفايل لـ `/complete`.
   الأدمن ناقص البروفايل مش المفروض يتطرد من الداشبورد. الحل: نستثني `/dashboard` من
   تحويل البروفايل (مع إبقاء الحماية الفعلية في `layout.tsx`):
   ```ts
   const isDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/')
   if (!isDashboard && getProfileGaps(session.user).length > 0) {
     return NextResponse.redirect(new URL('/complete/', request.url))
   }
   ```
   > ملاحظة: الـ middleware بيتنادى على كل تنقّل — نأجّل تحسين `proxy.ts` (P1-2 في
   > `docs/performance/`) لأنها خارج نطاق الداشبورد.

## 4. الصلاحيات (better-auth admin plugin)

### الإعداد

```ts
// lib/auth.ts — إضافة
import { admin } from 'better-auth/plugins'

plugins: [
  phoneNumber({ /* ... */ }),
  admin({
    defaultRole: 'user',
    adminRoles: ['admin'],
    // bootstrap اختياري لأول أدمن بدون SQL:
    adminUserIds: (process.env.ADMIN_USER_IDS ?? '').split(',').filter(Boolean),
  }),
],
```

```ts
// lib/auth-client.ts — إضافة
import { adminClient } from 'better-auth/client/plugins'
export const authClient = createAuthClient({
  plugins: [phoneNumberClient(), adminClient()],
})
```

### ما يضيفه الـ plugin

| الجدول | العمود | النوع |
|---|---|---|
| `user` | `role` | text (nullable) |
| `user` | `banned` | boolean default false |
| `user` | `banReason` | text |
| `user` | `banExpires` | timestamptz |
| `session` | `impersonatedBy` | text |

> الأعمدة دي **لازم** تتعمل لها migration قبل تفعيل الـ plugin (انظر `data-model.md`).

### نقاط النهاية الجاهزة (admin plugin)

`/admin/list-users`, `/admin/set-role`, `/admin/ban-user`, `/admin/unban-user`,
`/admin/remove-user`, `/admin/set-user-password`, `/admin/impersonate-user`,
`/admin/stop-impersonating`, `/admin/list-user-sessions`, `/admin/revoke-user-session`.

نستخدمها من `authClient.admin.*` في مكوّنات العميل، و/أو نلفّها بـ Server Actions.

### bootstrap أول أدمن

خياران (ننفّذ الاثنين للاحتياط):
1. `ADMIN_USER_IDS` env (مفصولة بفواصل) → `adminUserIds`.
2. seed SQL يدوي بعد الـ migration:
   ```sql
   UPDATE "user" SET role = 'admin' WHERE email = 'admin@example.com';
   ```

## 5. طبقة الوصول للبيانات

- **قراءة (Server Components):** `lib/dashboard/queries.ts` يستخدم `pool` مباشرة.
  - عدّادات: `SELECT count(*) ...`.
  - المستخدمون: pagination + بحث (ILIKE على email/name/phoneNumber).
  - التحليلات: aggregations على `play_events`.
- **كتابة (Mutations):** Server Actions في `app/dashboard/**/actions.ts` (مفضّلة على
  route handlers للـ forms)، أو route handlers لعمليات تحتاج JSON (تنظيف الكاش).
- **دمج الـ overrides:** `lib/dashboard/overrides.ts` يجيب `game_overrides` (cached)
  ويدمجها مع `ALL_GAMES` من `lib/games.ts`. الصفحات العامة تستخدم الدالة دي بدل
  الكتالوج الخام.
- **التحقق:** كل input يتحقق منه server-side (zod أو تحقق يدوي) — ممنوع الاعتماد على
  العميل. لا تُرسل أي أسرار للـ client.

## 6. الكاش والـ revalidation

الصفحات العامة حاليًا **static/SSG**. الـ overrides في DB معناها إننا لازم نعيد بناء
الصفحات المتأثرة بعد كل تعديل، وإلا التغيير مش هيظهر.

- بعد أي تعديل override:
  ```ts
  revalidatePath('/')
  revalidatePath(`/game/${slug}/`)
  revalidatePath('/games/')
  revalidatePath(`/game-category/${categorySlug}/`)
  ```
- للاستعلامات المكلفة داخل الداشبورد: `unstable_cache` مع `tags` + `revalidateTag`.
- `play_events` كتابة فقط (append-only) — القراءة للتحليلات ممكن تتخزّن مؤقتًا 60s.
- **ملاحظة:** لو لاحقًا شغّلنا `cacheComponents`، نستخدم `cacheTag`/`revalidateTag` بدل
  `revalidatePath` (خارج نطاق هذه المرحلة).

## 7. الأمان

- **الجلسة:** كل طلب إداري يمرّ على `auth.api.getSession` — لا نثق في أي client flag.
- **CSRF:** better-auth بيحمي الـ auth endpoints؛ Server Actions محمية من Next.
  route handlers الإدارية تتحقق من الجلسة والدور في كل request.
- **Rate limiting:** نضيفه على `/api/track/play` (كتابة عامة) و`/api/admin/*`.
- **Input validation:** كل كتابة تتحقق (طول/نوع/قيم مسموحة) قبل الوصول لـ DB.
- **Audit:** كل عملية كتابة إدارية تتسجّل في `audit_log`.
- **Impersonation:** لو مفعّلة، تظهر بانر تحذيري ونمنع الكتابة أثناءها (اختياري).

## 8. متغيّرات البيئة المطلوبة

| المتغيّر | الاستخدام |
|---|---|
| `DATABASE_URL` | موجود |
| `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` | موجود |
| `ADMIN_USER_IDS` | bootstrap أول أدمن (اختياري) |
| `WISP_HEALTH_URL` | فحص حالة Wisp من صفحة ops (اختياري، افتراضي `http://wisp:8081/health`) |

## 9. مخطط تدفق مختصر

```
مستخدم أدمن → /dashboard
   ├─ middleware (proxy.ts): يتخطّى تحويل البروفايل لـ /dashboard
   └─ app/dashboard/layout.tsx: getSession → role==='admin'؟ → DashboardShell
         ├─ page.tsx        → queries.ts (عدّادات)
         ├─ users/page.tsx  → queries + authClient.admin.* (client)
         ├─ games/page.tsx  → overrides.ts + Server Actions → revalidatePath
         ├─ analytics/page.tsx → play_events aggregations
         └─ ops/page.tsx    → image-cache stats + Wisp /health
```
