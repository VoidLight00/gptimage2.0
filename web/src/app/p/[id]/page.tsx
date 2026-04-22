import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getEntry,
  getManifest,
  getEntriesByCategory,
} from "@/lib/manifest";
import { PromptBlock } from "@/components/PromptBlock";

export function generateStaticParams() {
  return getManifest().entries.map((e) => ({ id: e.id }));
}

export default async function DetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const entry = getEntry(id);
  if (!entry) notFound();

  const related = getEntriesByCategory(entry.category)
    .filter((e) => e.id !== entry.id)
    .slice(0, 8);

  return (
    <div className="px-6 md:px-12 py-12 md:py-16">
      <div className="mx-auto max-w-[1400px]">
        <Link
          href={`/c/${entry.category}`}
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-50 hover:text-fg"
        >
          ← {entry.categoryLabel}
        </Link>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10">
          <div className="relative w-full bg-surface border border-border-subtle">
            <div
              className="relative w-full"
              style={{ aspectRatio: `${entry.images.width}/${entry.images.height}` }}
            >
              <Image
                src={entry.images.large}
                alt={entry.prompt.slice(0, 100)}
                fill
                sizes="(max-width: 1024px) 100vw, 900px"
                placeholder="blur"
                blurDataURL={entry.images.blurDataURL}
                className="object-contain"
                priority
              />
            </div>
          </div>

          <aside className="space-y-10">
            <div>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-block px-2 py-1 bg-fg text-bg font-mono text-[10px] uppercase tracking-[0.14em]">
                  {entry.categoryLabel}
                </span>
                {entry.domains?.map((d) => (
                  <span
                    key={d}
                    className="inline-block px-2 py-1 border border-border-strong font-mono text-[10px] uppercase tracking-[0.14em]"
                  >
                    {d}
                  </span>
                ))}
                {entry.formats?.map((f) => (
                  <span
                    key={f}
                    className="inline-block px-2 py-1 border border-border-subtle font-mono text-[10px] uppercase tracking-[0.14em] text-fg-70"
                  >
                    {f.replace("ar-", "").replace("-", ":")}
                  </span>
                ))}
                {entry.model && (
                  <span className="inline-block px-2 py-1 border border-border-subtle font-mono text-[10px] uppercase tracking-[0.14em] text-fg-70">
                    {entry.model}
                  </span>
                )}
                <span className="inline-block px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-50 ml-auto">
                  {entry.id}
                </span>
              </div>
              <h1 className="font-sans text-2xl md:text-3xl leading-tight tracking-tight">
                {entry.prompt.length > 100
                  ? entry.prompt.slice(0, 100) + "…"
                  : entry.prompt}
              </h1>
            </div>

            <PromptBlock label="Prompt" value={entry.prompt} />

            {entry.negativePrompt && (
              <PromptBlock label="Negative" value={entry.negativePrompt} />
            )}

            {entry.tags.length > 0 && (
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-50 mb-3">
                  Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-block px-2 py-1 border border-border-subtle font-mono text-[11px] text-fg-70"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-50 flex justify-between pt-4 border-t border-border-subtle">
              <span>{entry.images.width} × {entry.images.height}</span>
              <span>{entry.createdAt.slice(0, 10)}</span>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-24 pt-16 border-t border-border-subtle">
            <div className="flex items-end justify-between mb-10">
              <h2 className="font-sans text-2xl tracking-tight">Related</h2>
              <Link
                href={`/c/${entry.category}`}
                className="font-mono text-[12px] uppercase tracking-[0.14em] text-fg-50 hover:text-fg"
              >
                More in {entry.categoryLabel} →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.slice(0, 4).map((e) => (
                <Link
                  key={e.id}
                  href={`/p/${e.id}`}
                  className="relative border border-border-subtle hover:border-border-strong"
                >
                  <div
                    className="relative w-full bg-surface"
                    style={{ aspectRatio: `${e.images.width}/${e.images.height}` }}
                  >
                    <Image
                      src={e.images.thumb}
                      alt=""
                      fill
                      sizes="300px"
                      placeholder="blur"
                      blurDataURL={e.images.blurDataURL}
                      className="object-cover"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
