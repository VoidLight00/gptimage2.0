"use client";

import { useMemo, useState } from "react";
import { ImageCard } from "@/components/ImageCard";
import { SourceToggle, type SourceFilter } from "@/components/SourceToggle";
import type { PromptEntry, TagMeta } from "@/lib/types";

function getCopy(lang: "ko" | "en") {
  return lang === "ko"
    ? {
        domain: "도메인",
        format: "포맷",
        all: "전체",
        clear: "필터 초기화 ×",
        filter: "필터",
        result: "결과",
        noMatches: "조건에 맞는 항목이 없습니다.",
        closeFilters: "필터 닫기",
        close: "닫기",
        showResults: "결과 보기",
      }
    : {
        domain: "Domain",
        format: "Format",
        all: "ALL",
        clear: "Clear Filters ×",
        filter: "Filter",
        result: "result",
        noMatches: "No matches.",
        closeFilters: "Close filters",
        close: "Close",
        showResults: "Show results",
      };
}

export function CategoryFilter({
  entries,
  domains,
  formats,
  lang,
}: {
  entries: PromptEntry[];
  domains: TagMeta[];
  formats: TagMeta[];
  lang: "ko" | "en";
}) {
  const copy = getCopy(lang);
  const [domain, setDomain] = useState<string | null>(null);
  const [format, setFormat] = useState<string | null>(null);
  const [source, setSource] = useState<SourceFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);

  const counts = useMemo(
    () => ({
      all: entries.length,
      voidlight: entries.filter((entry) => entry.source === "voidlight").length,
      curated: entries.filter((entry) => entry.source !== "voidlight").length,
    }),
    [entries]
  );

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (source === "voidlight" && entry.source !== "voidlight") return false;
      if (source === "curated" && entry.source === "voidlight") return false;
      if (domain && !entry.domains.includes(domain)) return false;
      if (format && !entry.formats.includes(format)) return false;
      return true;
    });
  }, [entries, source, domain, format]);

  const hasFilters = domains.length > 0 || formats.length > 0;
  const activeCount = (domain ? 1 : 0) + (format ? 1 : 0);
  const resultLabel = lang === "ko" ? copy.result : filtered.length === 1 ? copy.result : `${copy.result}s`;

  const filterPanel = (
    <div className="space-y-10">
      {domains.length > 0 && (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-50 mb-4">
            {copy.domain}
          </h3>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setDomain(null)}
              className={`w-full text-left flex items-baseline justify-between font-mono text-[12px] py-2.5 px-3 min-h-[40px] ${
                domain === null ? "bg-fg text-bg" : "text-fg hover:bg-surface-hover"
              }`}
            >
              <span>{copy.all}</span>
              <span className="text-[10px] opacity-60">{entries.length}</span>
            </button>
            {domains.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setDomain(domain === item.slug ? null : item.slug)}
                className={`w-full text-left flex items-baseline justify-between font-mono text-[12px] py-2.5 px-3 min-h-[40px] ${
                  domain === item.slug ? "bg-fg text-bg" : "text-fg hover:bg-surface-hover"
                }`}
              >
                <span>{item.label.toUpperCase()}</span>
                <span className="text-[10px] opacity-60">{item.count}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {formats.length > 0 && (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-50 mb-4">
            {copy.format}
          </h3>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setFormat(null)}
              className={`w-full text-left flex items-baseline justify-between font-mono text-[12px] py-2.5 px-3 min-h-[40px] ${
                format === null ? "bg-fg text-bg" : "text-fg hover:bg-surface-hover"
              }`}
            >
              <span>{copy.all}</span>
              <span className="text-[10px] opacity-60">{entries.length}</span>
            </button>
            {formats.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setFormat(format === item.slug ? null : item.slug)}
                className={`w-full text-left flex items-baseline justify-between font-mono text-[12px] py-2.5 px-3 min-h-[40px] ${
                  format === item.slug ? "bg-fg text-bg" : "text-fg hover:bg-surface-hover"
                }`}
              >
                <span>{item.label}</span>
                <span className="text-[10px] opacity-60">{item.count}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {(domain || format) && (
        <button
          type="button"
          onClick={() => {
            setDomain(null);
            setFormat(null);
          }}
          className="w-full py-3 min-h-[44px] border border-border-strong font-mono text-[11px] uppercase tracking-[0.2em] text-fg-70 hover:bg-surface-hover"
        >
          {copy.clear}
        </button>
      )}
    </div>
  );

  return (
    <div className={hasFilters ? "lg:grid lg:grid-cols-[220px_1fr] lg:gap-10" : ""}>
      {hasFilters && <aside className="hidden lg:block">{filterPanel}</aside>}

      <div>
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between gap-3">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-50">
              {filtered.length} {resultLabel}
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] border border-border-strong font-mono text-[11px] uppercase tracking-[0.14em] hover:bg-surface-hover"
              >
                {copy.filter}
                {activeCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-fg text-bg text-[10px]">
                    {activeCount}
                  </span>
                )}
              </button>
            )}
          </div>
          <SourceToggle value={source} counts={counts} onChange={setSource} lang={lang} />
        </div>

        {filtered.length === 0 ? (
          <div className="border border-border-subtle bg-surface p-12 font-mono text-[13px] uppercase tracking-[0.14em] text-fg-50">
            {copy.noMatches}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
            {filtered.map((entry) => (
              <ImageCard key={entry.id} entry={entry} lang={lang} />
            ))}
          </div>
        )}
      </div>

      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            aria-label={copy.closeFilters}
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative bg-bg border-t border-border-strong max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <h2 className="font-mono text-[13px] uppercase tracking-[0.2em]">{copy.filter}</h2>
              <button
                type="button"
                aria-label={copy.close}
                onClick={() => setSheetOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-lg"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-8 flex-1">{filterPanel}</div>
            <div className="px-6 py-4 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="w-full py-3.5 min-h-[48px] bg-fg text-bg font-mono text-[13px] uppercase tracking-[0.14em]"
              >
                {lang === "ko" ? `${filtered.length}개 ${copy.showResults}` : `${copy.showResults} ${filtered.length} ${resultLabel}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
