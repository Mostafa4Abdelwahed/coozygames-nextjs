"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

export function AccountSection({
  icon,
  title,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const t = useTranslations("Common");
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-extrabold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100/10 text-brand-60">
            {icon}
          </span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}