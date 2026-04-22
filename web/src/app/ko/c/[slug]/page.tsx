import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategories,
  getEntriesByCategory,
  getDomains,
  getFormats,
  getManifest,
} from "@/lib/manifest";
import { CategoryFilter } from "./CategoryFilter";

export function generateStaticParams() {
  return getCategories("ko").map((c) => ({ slug: c.slug }));
}

export default async function Page(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const lang = "ko";
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

  return (
    <div className="px-6 md:px-12 py-16 md:py-24">
      <div className="mx-auto max-w-[1400px]">
        <Link
          href={`/${lang}/c`}
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-50 hover:text-fg"
        >
          ← All Categories
        </Link>
        <div className="flex items-end justify-between mt-8 mb-16 flex-wrap gap-6">
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
