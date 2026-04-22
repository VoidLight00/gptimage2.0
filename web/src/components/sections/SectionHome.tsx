import Link from "next/link";
import type { ArchiveManifest, PromptEntry } from "@/lib/types";
import { ImageCard } from "@/components/ImageCard";

export function SectionHome({
  lang,
  manifest,
  latest,
}: {
  lang: "ko" | "en";
  manifest: ArchiveManifest;
  latest: PromptEntry[];
}) {
  const categories = manifest.categories;
  return (
    <div>
      <section className="min-h-[70vh] flex flex-col justify-center px-4 md:px-12 py-16 md:py-24">
        <div className="mx-auto max-w-[1400px] w-full">
          <div className="flex items-center flex-wrap gap-2 md:gap-4 mb-6 md:mb-8">
            <Link
              href="/"
              className="inline-flex items-center min-h-[40px] font-mono text-[11px] uppercase tracking-[0.28em] text-fg-50 hover:text-fg"
            >
              ← ALL
            </Link>
            <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-fg-50">
              / SECTION · {lang.toUpperCase()}
            </span>
          </div>
          <h1
            className="font-mono font-light text-fg leading-[0.95]"
            style={{ fontSize: "clamp(44px, 14vw, 240px)", letterSpacing: "-0.02em" }}
          >
            {lang === "ko" ? "GPTIMAGE" : "GPT IMAGE"}
            <br />
            <span className="text-fg-50">{lang === "ko" ? "한국어" : "WORLD"}</span>
          </h1>
          <p className="mt-8 md:mt-12 max-w-xl font-sans text-base md:text-lg text-fg-70 leading-relaxed">
            {lang === "ko"
              ? "수백 개의 GPT 이미지와 그 프롬프트를 카테고리별로 아카이빙합니다. 프롬프트가 존재하는 작업물만 수록됩니다."
              : "Curated GPT Image 2 prompts sourced from X (Twitter) and the community, organized by subject and style."}
          </p>
          <div className="mt-8 md:mt-12 flex flex-wrap gap-3">
            <Link
              href={`/${lang}/c`}
              className="inline-flex items-center px-6 md:px-7 py-3.5 min-h-[48px] bg-fg text-bg font-mono text-[12px] md:text-[13px] uppercase tracking-[0.14em] hover:bg-fg/90 transition-colors"
            >
              Browse Archive
            </Link>
            <Link
              href={`/${lang}/search`}
              className="inline-flex items-center px-6 md:px-7 py-3.5 min-h-[48px] border border-border-strong font-mono text-[12px] md:text-[13px] uppercase tracking-[0.14em] hover:bg-surface-hover transition-colors"
            >
              Search
            </Link>
          </div>

          <div className="mt-14 md:mt-20 grid grid-cols-3 gap-5 md:gap-10 max-w-3xl font-mono uppercase">
            <div>
              <div className="text-fg-50 text-[10px] md:text-[11px] tracking-[0.2em]">Entries</div>
              <div className="text-fg text-3xl md:text-6xl mt-2 md:mt-3 font-light tracking-tight">
                {manifest.totalEntries.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-fg-50 text-[10px] md:text-[11px] tracking-[0.2em]">
                Categories
              </div>
              <div className="text-fg text-3xl md:text-6xl mt-2 md:mt-3 font-light tracking-tight">
                {categories.length}
              </div>
            </div>
            <div>
              <div className="text-fg-50 text-[10px] md:text-[11px] tracking-[0.2em]">Updated</div>
              <div className="text-fg text-[11px] md:text-xl mt-4 md:mt-5 tracking-tight">
                {manifest.generatedAt.slice(0, 10)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {latest.length > 0 && (
        <section className="px-4 md:px-12 py-16 md:py-24 border-t border-border-subtle">
          <div className="mx-auto max-w-[1400px]">
            <div className="flex items-end justify-between mb-8 md:mb-12 gap-3 flex-wrap">
              <h2 className="font-sans text-2xl md:text-3xl tracking-tight">Latest</h2>
              <Link
                href={`/${lang}/c`}
                className="font-mono text-[11px] md:text-[12px] uppercase tracking-[0.14em] text-fg-50 hover:text-fg"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
              {latest.map((e) => (
                <ImageCard key={e.id} entry={e} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="px-4 md:px-12 py-16 md:py-24 border-t border-border-subtle">
          <div className="mx-auto max-w-[1400px]">
            <h2 className="font-sans text-2xl md:text-3xl tracking-tight mb-8 md:mb-12">
              Categories
            </h2>
            <div className="divide-y divide-border-subtle">
              {categories.map((c, i) => (
                <Link
                  key={c.slug}
                  href={`/${lang}/c/${c.slug}`}
                  className="flex items-baseline justify-between py-5 md:py-6 group hover:bg-surface-hover -mx-4 md:-mx-6 px-4 md:px-6 gap-4"
                >
                  <div className="flex items-baseline gap-4 md:gap-6 min-w-0">
                    <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-fg-30 w-6 md:w-10 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="font-mono font-light uppercase tracking-[-0.01em] group-hover:text-fg-70 truncate"
                      style={{ fontSize: "clamp(22px, 5vw, 56px)" }}
                    >
                      {c.label}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] md:text-[12px] uppercase tracking-[0.14em] text-fg-50 shrink-0">
                    {c.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
