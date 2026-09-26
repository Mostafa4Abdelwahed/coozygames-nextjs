import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const PAGE_SIZE = 40;

function pageNumbers(page: number, total: number): (number | "…")[] {
  const nums = [...new Set([1, total, page - 1, page, page + 1])]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const n of nums) {
    if (n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

const btn =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors";

export function Pager({
  page,
  totalPages,
  basePath,
  params = {},
}: {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const q = new URLSearchParams(params);
    if (p > 1) q.set("page", String(p));
    else q.delete("page");
    const s = q.toString();
    return `${basePath}${s ? `?${s}` : ""}`;
  };

  return (
    <nav aria-label="التنقل بين الصفحات" className="flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          aria-label="الصفحة السابقة"
          className={`${btn} bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground`}
        >
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${btn} pointer-events-none text-muted-foreground opacity-40`}>
          <ChevronRight className="size-4" />
        </span>
      )}

      {pageNumbers(page, totalPages).map((n, i) =>
        n === "…" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-sm font-medium text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={n}
            href={href(n)}
            aria-label={`صفحة ${n}`}
            aria-current={n === page ? "page" : undefined}
            className={`${btn} ${
              n === page
                ? "bg-primary font-semibold text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {n}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          href={href(page + 1)}
          aria-label="الصفحة التالية"
          className={`${btn} bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground`}
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span aria-hidden="true" className={`${btn} pointer-events-none text-muted-foreground opacity-40`}>
          <ChevronLeft className="size-4" />
        </span>
      )}
    </nav>
  );
}