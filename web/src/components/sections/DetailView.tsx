import Link from "next/link";
import Image from "next/image";
import type { PromptEntry } from "@/lib/types";
import { PromptBlock } from "@/components/PromptBlock";

export function DetailView({
  entry,
  related,
  lang,
}: {
  entry: PromptEntry;
  related: PromptEntry[];
  lang: "ko" | "en";
}) {
  return (
    <div className="px-4 md:px-12 py-8 md:py-16">
      <div className="mx-auto max-w-[1400px]">
        <Link
          href={`/${lang}/c/${entry.category}`}
          className="inline-flex items-center min-h-[40px] font-mono text-[11px] uppercase tracking-[0.2em] text-fg-50 hover:text-fg"
        >
          ← {entry.categoryLabel}
        </Link>

        <div className="mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 md:gap-10">
          <div className="relative w-full bg-surface border border-border-subtle">
            <div
              className="relative w-full"
              style={{ aspectRatio: `${entry.images.width}/${entry.images.height}` }}
            >
              <Image
                src={entry.images.large}
                alt={entry.title ?? entry.prompt.slice(0, 100)}
                fill
                sizes="(max-width: 1024px) 100vw, 900px"
                placeholder="blur"
                blurDataURL={entry.images.blurDataURL}
                className="object-contain"
                priority
              />
            </div>
          </div>

          <aside className="space-y-8 md:space-y-10">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-5 md:mb-6">
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
                <span className="inline-block px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-50 ml-auto">
                  {entry.id}
                </span>
              </div>
              <h1 className="font-sans text-xl md:text-3xl leading-tight tracking-tight">
                {entry.title ??
                  (entry.prompt.length > 100 ? entry.prompt.slice(0, 100) + "…" : entry.prompt)}
              </h1>
            </div>

            <PromptBlock label="Prompt" value={entry.prompt} />

            {entry.negativePrompt && <PromptBlock label="Negative" value={entry.negativePrompt} />}

            {entry.tags.length > 0 && (
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-50 mb-3">
                  Tags
                </div>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
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

            {entry.sourceUrl && (
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-50 mb-3">
                  Source
                </div>
                <a
                  href={entry.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-block min-h-[40px] py-2 font-mono text-[12px] text-fg-70 hover:text-fg break-all border-b border-border-subtle"
                >
                  {entry.sourceUrl}
                </a>
              </div>
            )}

            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-50 flex justify-between pt-4 border-t border-border-subtle">
              <span>
                {entry.images.width} × {entry.images.height}
              </span>
              <span>{entry.createdAt.slice(0, 10)}</span>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16 md:mt-24 pt-10 md:pt-16 border-t border-border-subtle">
            <div className="flex items-end justify-between mb-8 md:mb-10 gap-3 flex-wrap">
              <h2 className="font-sans text-xl md:text-2xl tracking-tight">Related</h2>
              <Link
                href={`/${lang}/c/${entry.category}`}
                className="font-mono text-[11px] md:text-[12px] uppercase tracking-[0.14em] text-fg-50 hover:text-fg"
              >
                More →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              {related.slice(0, 4).map((e) => (
                <Link
                  key={e.id}
                  href={`/${lang}/p/${e.id}`}
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
                      sizes="(max-width: 640px) 50vw, 300px"
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
