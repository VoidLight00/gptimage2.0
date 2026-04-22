import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategories,
  getEntriesByCategory,
  getManifest,
} from "@/lib/manifest";
import { ImageCard } from "@/components/ImageCard";

export function generateStaticParams() {
  return getCategories().map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const categories = getManifest().categories;
  const meta = categories.find((c) => c.slug === slug);
  const entries = getEntriesByCategory(slug);

  if (!meta) notFound();

  return (
    <div className="px-6 md:px-12 py-16 md:py-24">
      <div className="mx-auto max-w-[1400px]">
        <Link
          href="/c"
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
            No entries in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {entries.map((e) => (
              <ImageCard key={e.id} entry={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
