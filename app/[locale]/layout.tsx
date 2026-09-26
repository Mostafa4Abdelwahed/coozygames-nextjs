import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import { Cairo } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { SiteShell } from "@/components/site-shell";
import { navCategories } from "@/lib/categories";
import "../globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800"],
});

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    appleWebApp: {
      capable: true,
      title: "Coozy Games",
      statusBarStyle: "black-translucent",
    },
    formatDetection: {
      telephone: false,
      date: false,
      address: false,
      email: false,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0c0d14",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={`${cairo.className} h-full antialiased`}>
      <body dir={dir} className="min-h-full flex flex-col">
        <Script
          id="czy-dashboard-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var p=location.pathname;document.documentElement.classList.toggle('light',p.includes('/dashboard'))})()`,
          }}
        />
        <NextIntlClientProvider messages={(await import(`@/messages/${locale}.json`)).default}>
          <SiteShell categories={navCategories()}>{children}</SiteShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}