import Link from "next/link";
import Image from "next/image";
import type { ArchiveManifest, PromptEntry } from "@/lib/types";
import { ImageCard } from "@/components/ImageCard";

function getCopy(lang: "ko" | "en") {
  return lang === "ko"
    ? {
        browse: "아카이브 탐색",
        search: "검색",
        entries: "항목",
        categories: "카테고리",
        updated: "업데이트",
        latest: "최신 프롬프트",
        featuredCategories: "카테고리",
        viewAll: "전체 보기 →",
        categoryEntries: "개 항목",
      }
    : {
        browse: "Browse Archive",
        search: "Search",
        entries: "Entries",
        categories: "Categories",
        updated: "Updated",
        latest: "Latest",
        featuredCategories: "Categories",
        viewAll: "View All →",
        categoryEntries: "entries",
      };
}

export function SectionHome({
  lang,
  manifest,
  latest,
}: {
  lang: "ko" | "en";
  manifest: ArchiveManifest;
  latest: PromptEntry[];
}) {
  const copy = getCopy(lang);
  const categories = manifest.categories;
  const featuredCategories = categories.slice(0, 6);

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
              : "Curated GPT Image prompts with browseable categories, reusable prompt recipes, and source attribution built into every entry."}
          </p>
          <div className="mt-8 md:mt-12 flex flex-wrap gap-3">
            <Link
              href={`/${lang}/c`}
              className="inline-flex items-center px-6 md:px-7 py-3.5 min-h-[48px] bg-fg text-bg font-mono text-[12px] md:text-[13px] uppercase tracking-[0.14em] hover:bg-fg/90 transition-colors"
            >
              {copy.browse}
            </Link>
            <Link
              href={`/${lang}/search`}
              className="inline-flex items-center px-6 md:px-7 py-3.5 min-h-[48px] border border-border-strong font-mono text-[12px] md:text-[13px] uppercase tracking-[0.14em] hover:bg-surface-hover transition-colors"
            >
              {copy.search}
            </Link>
          </div>

          <div className="mt-14 md:mt-20 grid grid-cols-3 gap-5 md:gap-10 max-w-3xl font-mono uppercase">
            <div>
              <div className="text-fg-50 text-[10px] md:text-[11px] tracking-[0.2em]">{copy.entries}</div>
              <div className="text-fg text-3xl md:text-6xl mt-2 md:mt-3 font-light tracking-tight">
                {manifest.totalEntries.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-fg-50 text-[10px] md:text-[11px] tracking-[0.2em]">{copy.categories}</div>
              <div className="text-fg text-3xl md:text-6xl mt-2 md:mt-3 font-light tracking-tight">
                {categories.length}
              </div>
            </div>
            <div>
              <div className="text-fg-50 text-[10px] md:text-[11px] tracking-[0.2em]">{copy.updated}</div>
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
              <h2 className="font-sans text-2xl md:text-3xl tracking-tight">{copy.latest}</h2>
              <Link
                href={`/${lang}/c`}
                className="font-mono text-[11px] md:text-[12px] uppercase tracking-[0.14em] text-fg-50 hover:text-fg"
              >
                {copy.viewAll}
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
              {latest.map((entry) => (
                <ImageCard key={entry.id} entry={entry} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}

      {featuredCategories.length > 0 && (
        <section className="px-4 md:px-12 py-16 md:py-24 border-t border-border-subtle">
          <div className="mx-auto max-w-[1400px]">
            <div className="flex items-end justify-between mb-8 md:mb-12 gap-3 flex-wrap">
              <h2 className="font-sans text-2xl md:text-3xl tracking-tight">{copy.featuredCategories}</h2>
              <Link
                href={`/${lang}/c`}
                className="font-mono text-[11px] md:text-[12px] uppercase tracking-[0.14em] text-fg-50 hover:text-fg"
              >
                {copy.viewAll}
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {featuredCategories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/${lang}/c/${category.slug}`}
                  className="group border border-border-subtle hover:border-border-strong bg-surface overflow-hidden"
                >
                  <div className="relative aspect-[4/3] bg-surface">
                    {category.cover ? (
                      <Image
                        src={category.cover}
                        alt={category.label}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-50">
                        {lang === "ko" ? `${category.count}${copy.categoryEntries}` : `${category.count} ${copy.categoryEntries}`}
                      </div>
                      <div className="mt-2 font-sans text-2xl md:text-3xl tracking-tight text-fg line-clamp-2">
                        {category.label}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
