import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { getProfileGaps } from "@/lib/profile";

const intlMiddleware = createMiddleware(routing);

const OPEN_PATHS = ["/login", "/register", "/complete"];
const LOCALE_RE = /^\/(ar|en)(?=\/|$)/;

function stripLocale(pathname: string): string {
  return pathname.replace(LOCALE_RE, "") || "/";
}

export async function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  const path = stripLocale(request.nextUrl.pathname);

  if (OPEN_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) {
    return intlResponse;
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return intlResponse;
  }

  const isDashboard = path === "/dashboard" || path.startsWith("/dashboard/");
  if (!isDashboard && getProfileGaps(session.user).length > 0) {
    const locale = request.nextUrl.pathname.match(LOCALE_RE)?.[1] ?? routing.defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/complete/`, request.url));
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|image|_vercel|.*\\..*).*)",
  ],
};