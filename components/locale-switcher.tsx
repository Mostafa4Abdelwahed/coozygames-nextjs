"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { MdExpandMore } from "react-icons/md";
import { routing } from "@/i18n/routing";

const FLAGS: Record<string, { src: string; alt: string }> = {
  ar: { src: "/flags/sa.png", alt: "Saudi Arabia" },
  en: { src: "/flags/us.svg", alt: "United States" },
};

const LOCALE_LABELS: Record<string, string> = {
  ar: "العربية",
  en: "English",
};

function FlagIcon({ locale, className }: { locale: string; className?: string }) {
  const flag = FLAGS[locale];
  if (!flag) return <span className={className}>🌐</span>;
  return (
    <Image
      src={flag.src}
      alt={flag.alt}
      width={28}
      height={20}
      className={`rounded-sm object-cover ${className ?? ""}`}
    />
  );
}

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("Common");

  // The button shows the language you'll switch to (the opposite of current).
  const targetLocale = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale;

  useEffect(() => {
    setMounted(true);
  }, []);

  function switchLocale(nextLocale: string) {
    router.push(pathname || "/", { locale: nextLocale });
    router.refresh();
    setOpen(false);
  }

  if (!mounted) {
    return (
      <div className="relative">
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          aria-label={t("language")}
        >
          <FlagIcon locale={targetLocale} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        aria-label={t("language")}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <FlagIcon locale={targetLocale} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full z-50 mt-2 min-w-[140px] rounded-xl border bg-popover py-1 text-popover-foreground shadow-lg">
            {routing.locales.map((nextLocale) => (
              <button
                key={nextLocale}
                onClick={() => switchLocale(nextLocale)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-bold transition ${
                  nextLocale === locale
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent"
                }`}
              >
                <FlagIcon locale={nextLocale} />
                <span>{LOCALE_LABELS[nextLocale]}</span>
                {nextLocale === locale && <MdExpandMore size={18} className="ms-auto" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}