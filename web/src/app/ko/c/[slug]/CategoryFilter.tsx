"use client";

import { useMemo, useState } from "react";
import { ImageCard } from "@/components/ImageCard";
import type { PromptEntry, TagMeta } from "@/lib/types";

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
  const [domain, setDomain] = useState<string | null>(null);
  const [format, setFormat] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (domain && !e.domains.includes(domain)) return false;
      if (format && !e.formats.includes(format)) return false;
      return true;
    });
  }, [entries, domain, format]);

  const hasFilters = domains.length > 0 || formats.length > 0;
  const activeCount = (domain ? 1 : 0) + (format ? 1 : 0);

  const filterPanel = (
    <div className="space-y-10">
      {domains.length > 0 && (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-50 mb-4">
            Domain
          </h3>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setDomain(null)}
              className={`w-full text-left flex items-baseline justify-between font-mono text-[12px] py-2.5 px-3 min-h-[40px] ${
                domain === null ? "bg-fg text-bg" : "text-fg hover:bg-surface-hover"
              }`}
            >
              <span>ALL</span>
              <span className="text-[10px] opacity-60">{entries.length}</span>
            </button>
            {domains.map((d) => (
              <button
                key={d.slug}
                type="button"
                onClick={() => setDomain(domain === d.slug ? null : d.slug)}
                className={`w-full text-left flex items-baseline justify-between font-mono text-[12px] py-2.5 px-3 min-h-[40px] ${
                  domain === d.slug ? "bg-fg text-bg" : "text-fg hover:bg-surface-hover"
                }`}
              >
                <span>{d.label.toUpperCase()}</span>
                <span className="text-[10px] opacity-60">{d.count}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {formats.length > 0 && (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-50 mb-4">
            Format
          </h3>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setFormat(null)}
              className={`w-full text-left flex items-baseline justify-between font-mono text-[12px] py-2.5 px-3 min-h-[40px] ${
                format === null ? "bg-fg text-bg" : "text-fg hover:bg-surface-hover"
              }`}
            >
              <span>ALL</span>
              <span className="text-[10px] opacity-60">{entries.length}</span>
            </button>
            {formats.map((f) => (
              <button
                key={f.slug}
                type="button"
                onClick={() => setFormat(format === f.slug ? null : f.slug)}
                className={`w-full text-left flex items-baseline justify-between font-mono text-[12px] py-2.5 px-3 min-h-[40px] ${
                  format === f.slug ? "bg-fg text-bg" : "text-fg hover:bg-surface-hover"
                }`}
              >
                <span>{f.label}</span>
                <span className="text-[10px] opacity-60">{f.count}</span>
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
          Clear Filters ×
        </button>
      )}
    </div>
  );

  return (
    <div className={hasFilters ? "lg:grid lg:grid-cols-[220px_1fr] lg:gap-10" : ""}>
      {/* 데스크톱 사이드바 */}
      {hasFilters && <aside className="hidden lg:block">{filterPanel}</aside>}

      <div>
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-50">
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </div>

          {/* 모바일 필터 버튼 */}
          {hasFilters && (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] border border-border-strong font-mono text-[11px] uppercase tracking-[0.14em] hover:bg-surface-hover"
            >
              Filter
              {activeCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 bg-fg text-bg text-[10px]">
                  {activeCount}
                </span>
              )}
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="border border-border-subtle bg-surface p-12 font-mono text-[13px] uppercase tracking-[0.14em] text-fg-50">
            No matches.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
            {filtered.map((e) => (
              <ImageCard key={e.id} entry={e} lang={lang} />
            ))}
          </div>
        )}
      </div>

      {/* 모바일 필터 바텀 시트 */}
      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative bg-bg border-t border-border-strong max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <h2 className="font-mono text-[13px] uppercase tracking-[0.2em]">Filter</h2>
              <button
                type="button"
                aria-label="Close"
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
                Show {filtered.length} result{filtered.length === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
