"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { routing } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  }

  if (!mounted) {
    return (
      <button
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        aria-label={t("language")}
      >
        <FlagIcon locale={targetLocale} />
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            aria-label={t("language")}
          >
            <FlagIcon locale={targetLocale} />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {routing.locales.map((nextLocale) => (
            <DropdownMenuItem
              key={nextLocale}
              onClick={() => switchLocale(nextLocale)}
              className="gap-3 py-2.5"
            >
              <FlagIcon locale={nextLocale} />
              <span className="font-medium">{LOCALE_LABELS[nextLocale]}</span>
              {nextLocale === locale && <Check size={16} className="ms-auto text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}