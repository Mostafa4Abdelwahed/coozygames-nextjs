"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { MdChevronLeft, MdClose, MdSearch, MdTrendingUp } from "react-icons/md";
import { categoryLabelAr, categoryStyle } from "@/lib/category-meta";
import { MINI_THUMB_WIDTH, thumbUrl } from "@/lib/image";
import Image from "next/image";

const POPULAR_SEARCHES = ["Race", "Puzzle", "Football", "Chess", "Action"];

const DEBOUNCE_MS = 300;

type SearchResult = {
  slug: string;
  title: string;
  categorySlug: string;
  categoryLabel: string;
  plays: string;
  rating: number;
  thumb?: string;
};

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Search");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [resolved, setResolved] = useState<{ query: string; results: SearchResult[] }>({
    query: "",
    results: [],
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const q = debouncedQuery;

    async function run() {
      if (!q) {
        setResolved({ query: "", results: [] });
        return;
      }
      let results: SearchResult[] = [];
      try {
        const res = await fetch(`/api/games/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (res.ok) {
          const data: { results?: SearchResult[] } = await res.json();
          results = data.results ?? [];
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
      setResolved({ query: q, results });
    }

    run();
    return () => controller.abort();
  }, [debouncedQuery]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const results = resolved.results;
  const isTyping = query.trim() !== debouncedQuery || resolved.query !== debouncedQuery;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4" role="dialog" aria-modal="true" aria-label={t("close")}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative mt-[8vh] w-full max-w-xl overflow-hidden rounded-2xl border border-night-60 bg-night-80 shadow-2xl sm:mt-[12vh]">
        <div className="flex items-center gap-2 border-b border-night-60 px-4">
          <MdSearch size={22} className="shrink-0 text-mist-50" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            className="h-14 w-full bg-transparent text-start text-base font-bold text-white outline-none placeholder:text-mist-50"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("clear")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-mist-50 transition hover:bg-night-60 hover:text-white"
            >
              <MdClose size={18} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-night-60 text-mist-50 transition hover:text-white"
          >
            <MdClose size={18} />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {isTyping ? (
            <div className="flex flex-col gap-1" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 rounded-xl px-3 py-2.5">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-night-60" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-3 w-2/3 rounded bg-night-60" />
                    <div className="h-2.5 w-1/3 rounded bg-night-60" />
                  </div>
                </div>
              ))}
            </div>
          ) : debouncedQuery === "" ? (
            <div className="px-2 py-1">
              <p className="flex items-center gap-2 px-2 py-2 text-sm font-bold text-mist-50">
                <MdTrendingUp size={18} />
                {t("popularSearches")}
              </p>
              <div className="flex flex-wrap gap-2 px-2 pb-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="rounded-full border border-night-60 bg-night-60 px-4 py-1.5 text-sm font-bold text-white transition hover:border-brand-100 hover:bg-brand-100"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {results.map((game) => (
                <li key={game.slug}>
                  <Link href={`/game/${game.slug}/`} onClick={onClose} className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-night-60">
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-night-60">
                      {game.thumb ? (
                        <Image src={thumbUrl(game.thumb, MINI_THUMB_WIDTH) as string} alt="" width={80} height={80} sizes="40px" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-brand-60">
                          {(() => {
                            const Icon = categoryStyle(game.categorySlug).icon;
                            return <Icon size={22} />;
                          })()}
                        </span>
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col text-start">
                      <span className="truncate text-[15px] font-bold text-white">{game.title}</span>
                      <span className="text-xs font-semibold text-mist-50">
                        {categoryLabelAr(game.categorySlug, game.categoryLabel)} • {game.plays} • ★ {game.rating}
                      </span>
                    </span>
                    <MdChevronLeft size={20} className="shrink-0 text-mist-50" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <MdSearch size={36} className="text-mist-50" />
              <p className="font-bold text-white">{t("noResults", { query: debouncedQuery })}</p>
              <p className="text-sm text-mist-50">{t("tryDifferent")}</p>
            </div>
          )}
        </div>

        <div className="border-t border-night-60 px-4 py-2 text-xs text-mist-50">
          {t("searchInBoth")}
        </div>
      </div>
    </div>
  );
}