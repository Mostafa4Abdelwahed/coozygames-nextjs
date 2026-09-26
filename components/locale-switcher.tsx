"use client";

import { useState, useEffect } from "react";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MdLanguage, MdExpandMore } from "react-icons/md";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  ar: "العربية",
  en: "English",
};

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("Common");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Extract current locale from pathname (e.g., /ar/games -> ar)
  const currentLocale = pathname?.split("/")[1] || routing.defaultLocale;
  const currentLabel = LOCALE_LABELS[currentLocale] || currentLocale;

  function switchLocale(locale: string) {
    const newPath = pathname?.replace(`/${currentLocale}/`, `/${locale}/`) || `/${locale}/`;
    router.push(newPath);
    router.refresh();
    setOpen(false);
  }

  if (!mounted) {
    return (
      <div className="relative">
<button
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-mist-90 transition hover:text-mist-50"
        aria-label={t("language")}
      >
        <MdLanguage size={22} />
      </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-mist-90 transition hover:text-mist-50"
        aria-label={t("language")}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <MdLanguage size={22} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full z-50 mt-2 min-w-[140px] rounded-xl border border-night-60 bg-night-80 py-1 shadow-lg">
            {routing.locales.map((locale) => (
              <Link
                key={locale}
                href={pathname?.replace(`/${currentLocale}/`, `/${locale}/`) || `/${locale}/`}
                onClick={() => {
                  switchLocale(locale);
                }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold transition ${
                  locale === currentLocale
                    ? "bg-brand-100/10 text-brand-60"
                    : "text-white hover:bg-night-60"
                }`}
              >
                <span>{LOCALE_LABELS[locale]}</span>
                {locale === currentLocale && <MdExpandMore size={18} className="ms-auto" />}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}