import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategories,
  getEntriesByCategory,
  getDomains,
  getFormats,
  getManifest,
} from "@/lib/manifest";
import { buildCategoryMetadata } from "@/lib/page-metadata";
import { CategoryFilter } from "@/app/ko/c/[slug]/CategoryFilter";

export function generateStaticParams() {
  return getCategories("en").map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const category = getManifest("en").categories.find((item) => item.slug === slug);
  if (!category) {
    return {
      title: "Not Found · EN — GPTIMAGE 2.0",
      description: "The requested category could not be found.",
    };
  }
  return buildCategoryMetadata("en", category);
}

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const lang = "en";
  const meta = getManifest(lang).categories.find((c) => c.slug === slug);
  const entries = getEntriesByCategory(lang, slug);
  if (!meta) notFound();

  const domainCounts: Record<string, number> = {};
  const formatCounts: Record<string, number> = {};
  for (const e of entries) {
    for (const d of e.domains) domainCounts[d] = (domainCounts[d] || 0) + 1;
    for (const f of e.formats) formatCounts[f] = (formatCounts[f] || 0) + 1;
  }
  const domains = getDomains(lang)
    .filter((d) => domainCounts[d.slug])
    .map((d) => ({ ...d, count: domainCounts[d.slug] }));
  const formats = getFormats(lang)
    .filter((f) => formatCounts[f.slug])
    .map((f) => ({ ...f, count: formatCounts[f.slug] }));

  const topDomains = domains.slice(0, 4);
  const topFormats = formats.slice(0, 3);

  return (
    <div className="px-6 md:px-12 py-16 md:py-24">
      <div className="mx-auto max-w-[1400px]">
        <Link
          href={`/${lang}/c`}
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-50 hover:text-fg"
        >
          ← All Categories
        </Link>
        <div className="mt-8 mb-6">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-4">
            <h1
              className="font-mono font-light uppercase"
              style={{ fontSize: "clamp(40px, 8vw, 128px)", letterSpacing: "-0.02em" }}
            >
              {meta.label}
            </h1>
            <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-fg-50">
              {meta.count} entries
            </span>
          </div>
          {meta.description && (
            <p className="font-sans text-[14px] md:text-base text-fg-70 leading-relaxed max-w-2xl mb-5">
              {meta.description}
            </p>
          )}
          {(topDomains.length > 0 || topFormats.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-10">
              {topDomains.map((d) => (
                <span
                  key={d.slug}
                  className="inline-flex items-center gap-1.5 px-3 py-1 border border-border-subtle font-mono text-[10px] uppercase tracking-[0.12em] text-fg-60"
                >
                  {d.slug}
                  <span className="text-fg-30">{d.count}</span>
                </span>
              ))}
              {topFormats.map((f) => (
                <span
                  key={f.slug}
                  className="inline-flex items-center gap-1.5 px-3 py-1 border border-border-strong font-mono text-[10px] uppercase tracking-[0.12em] text-fg-50"
                >
                  {f.label}
                  <span className="text-fg-30">{f.count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {entries.length === 0 ? (
          <div className="border border-border-subtle bg-surface p-12 font-mono text-[13px] uppercase tracking-[0.14em] text-fg-50">
            No entries.
          </div>
        ) : (
          <CategoryFilter entries={entries} domains={domains} formats={formats} lang={lang} />
        )}
      </div>
    </div>
  );
}
