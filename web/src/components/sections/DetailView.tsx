import Link from "next/link";
import Image from "next/image";
import type { PromptEntry } from "@/lib/types";
import { ArgsEditor } from "@/components/ArgsEditor";
import { Attribution } from "@/components/Attribution";
import { ImageCard } from "@/components/ImageCard";
import { PromptBlock } from "@/components/PromptBlock";
import { SourceBadge } from "@/components/SourceBadge";

function getCopy(lang: "ko" | "en") {
  return lang === "ko"
    ? {
        tags: "태그",
        source: "출처",
        related: "관련 프롬프트",
        more: "더보기 →",
      }
    : {
        tags: "Tags",
        source: "Source",
        related: "Related",
        more: "More →",
      };
}

export function DetailView({
  entry,
  related,
  lang,
}: {
  entry: PromptEntry;
  related: PromptEntry[];
  lang: "ko" | "en";
}) {
  const copy = getCopy(lang);

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
                placeholder={entry.images.blurDataURL ? "blur" : "empty"}
                blurDataURL={entry.images.blurDataURL || undefined}
                className="object-contain"
                priority
              />
            </div>
          </div>

          <aside className="space-y-8 md:space-y-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-5 md:mb-6">
                <span className="inline-block px-2 py-1 bg-fg text-bg font-mono text-[10px] uppercase tracking-[0.14em]">
                  {entry.categoryLabel}
                </span>
                <SourceBadge source={entry.source} license={entry.attribution?.license} />
                <span className="inline-block px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-50">
                  {entry.id}
                </span>
              </div>
              <h1 className="font-sans text-xl md:text-3xl leading-tight tracking-tight">
                {entry.title ??
                  (entry.prompt.length > 100 ? entry.prompt.slice(0, 100) + "…" : entry.prompt)}
              </h1>
              {(entry.domains.length > 0 || entry.formats.length > 0) && (
                <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-50 flex flex-wrap gap-x-3 gap-y-1">
                  {entry.domains.map((domain) => (
                    <span key={domain}>{domain}</span>
                  ))}
                  {entry.formats.map((format) => (
                    <span key={format}>{format.replace("ar-", "").replace("-", ":")}</span>
                  ))}
                </div>
              )}
            </div>

            <PromptBlock label="Prompt" value={entry.prompt} />
            <ArgsEditor key={entry.id} prompt={entry.promptBody} lang={lang} />

            {entry.tags.length > 0 && (
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-50 mb-3">
                  {copy.tags}
                </div>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-2 py-1 border border-border-subtle font-mono text-[11px] text-fg-70"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {entry.sourceUrl && (
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-50 mb-3">
                  {copy.source}
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

            <Attribution attribution={entry.attribution} />
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16 md:mt-24 pt-10 md:pt-16 border-t border-border-subtle">
            <div className="flex items-end justify-between mb-8 md:mb-10 gap-3 flex-wrap">
              <h2 className="font-sans text-xl md:text-2xl tracking-tight">{copy.related}</h2>
              <Link
                href={`/${lang}/c/${entry.category}`}
                className="font-mono text-[11px] md:text-[12px] uppercase tracking-[0.14em] text-fg-50 hover:text-fg"
              >
                {copy.more}
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              {related.slice(0, 4).map((relatedEntry) => (
                <ImageCard key={relatedEntry.id} entry={relatedEntry} lang={lang} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
