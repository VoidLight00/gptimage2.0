import Link from "next/link";
import Image from "next/image";
import type { CategoryMeta } from "@/lib/types";

function getCopy(lang: "ko" | "en") {
  return lang === "ko"
    ? {
        title: "카테고리",
        empty: "아직 카테고리가 없습니다.",
        entries: "개 항목",
        open: "열기 →",
      }
    : {
        title: "CATEGORIES",
        empty: "No categories yet.",
        entries: "entries",
        open: "Open →",
      };
}

export function CategoryIndexView({
  lang,
  categories,
}: {
  lang: "ko" | "en";
  categories: CategoryMeta[];
}) {
  const copy = getCopy(lang);

  return (
    <div className="px-4 md:px-12 py-12 md:py-24">
      <div className="mx-auto max-w-[1400px]">
        <div className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-fg-50 mb-4 md:mb-6">
          ― INDEX · {lang.toUpperCase()}
        </div>
        <h1
          className="font-mono font-light leading-[0.95] mb-10 md:mb-16"
          style={{ fontSize: "clamp(40px, 10vw, 160px)", letterSpacing: "-0.02em" }}
        >
          {copy.title}
        </h1>
        {categories.length === 0 ? (
          <div className="border border-border-subtle bg-surface p-12 font-mono text-[13px] uppercase tracking-[0.14em] text-fg-50">
            {copy.empty}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
            {categories.map((category, index) => (
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
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-2 font-sans text-2xl md:text-3xl tracking-tight text-fg line-clamp-2">
                      {category.label}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 p-4 md:p-5 border-t border-border-subtle font-mono text-[11px] uppercase tracking-[0.14em] text-fg-50">
                  <span>{lang === "ko" ? `${category.count}${copy.entries}` : `${category.count} ${copy.entries}`}</span>
                  <span className="text-fg">{copy.open}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
