import Link from "next/link";
import type { CategoryMeta } from "@/lib/types";

export function CategoryIndexView({
  lang,
  categories,
}: {
  lang: "ko" | "en";
  categories: CategoryMeta[];
}) {
  return (
    <div className="px-6 md:px-12 py-16 md:py-24">
      <div className="mx-auto max-w-[1400px]">
        <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-fg-50 mb-6">
          ― INDEX · {lang.toUpperCase()}
        </div>
        <h1
          className="font-mono font-light leading-[0.95] mb-16"
          style={{ fontSize: "clamp(48px, 10vw, 160px)", letterSpacing: "-0.02em" }}
        >
          CATEGORIES
        </h1>
        {categories.length === 0 ? (
          <div className="border border-border-subtle bg-surface p-12 font-mono text-[13px] uppercase tracking-[0.14em] text-fg-50">
            No categories yet.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {categories.map((c, i) => (
              <Link
                key={c.slug}
                href={`/${lang}/c/${c.slug}`}
                className="flex items-baseline justify-between py-6 group hover:bg-surface-hover -mx-6 px-6"
              >
                <div className="flex items-baseline gap-6">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-30 w-10">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="font-mono font-light uppercase group-hover:text-fg-70"
                    style={{ fontSize: "clamp(28px, 5vw, 64px)", letterSpacing: "-0.01em" }}
                  >
                    {c.label}
                  </span>
                </div>
                <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-fg-50">
                  {c.count}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
