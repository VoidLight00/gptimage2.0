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

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (domain && !e.domains.includes(domain)) return false;
      if (format && !e.formats.includes(format)) return false;
      return true;
    });
  }, [entries, domain, format]);

  const hasFilters = domains.length > 0 || formats.length > 0;

  return (
    <div className={hasFilters ? "grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10" : ""}>
      {hasFilters && (
        <aside className="space-y-10">
          {domains.length > 0 && (
            <section>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-50 mb-4">
                Domain
              </h3>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setDomain(null)}
                  className={`w-full text-left flex items-baseline justify-between font-mono text-[11px] py-1.5 px-2 ${
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
                    className={`w-full text-left flex items-baseline justify-between font-mono text-[11px] py-1.5 px-2 ${
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
                  className={`w-full text-left flex items-baseline justify-between font-mono text-[11px] py-1.5 px-2 ${
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
                    className={`w-full text-left flex items-baseline justify-between font-mono text-[11px] py-1.5 px-2 ${
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
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-fg-50 hover:text-fg border-b border-border-subtle pb-1"
            >
              Clear Filters ×
            </button>
          )}
        </aside>
      )}

      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-50 mb-6">
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
        </div>
        {filtered.length === 0 ? (
          <div className="border border-border-subtle bg-surface p-12 font-mono text-[13px] uppercase tracking-[0.14em] text-fg-50">
            No matches.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((e) => (
              <ImageCard key={e.id} entry={e} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
