import Link from "next/link";
import Image from "next/image";
import type { PromptEntry } from "@/lib/types";
import { SourceBadge } from "@/components/SourceBadge";
import { CopyPromptButton } from "@/components/CopyPromptButton";

export function ImageCard({
  entry,
  lang = "ko",
}: {
  entry: PromptEntry;
  lang?: "ko" | "en";
}) {
  const aspect = entry.images.width / entry.images.height;
  const title = entry.title ?? entry.prompt.slice(0, 100);

  return (
    <div className="group relative overflow-hidden border border-border-subtle hover:border-border-strong focus-within:border-fg">
      <Link href={`/${lang}/p/${entry.id}`} className="block">
        <div className="relative w-full bg-surface" style={{ aspectRatio: `${aspect}` }}>
          <Image
            src={entry.images.medium}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            placeholder={entry.images.blurDataURL ? "blur" : "empty"}
            blurDataURL={entry.images.blurDataURL || undefined}
            className="object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-bg/95 via-bg/75 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 md:block">
            <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-fg-70">
              {entry.categoryLabel} · {entry.id}
            </div>
            <div className="line-clamp-2 font-mono text-[12px] leading-[1.5] text-fg">{entry.title ?? entry.prompt}</div>
          </div>
        </div>

        <div className="border-t border-border-subtle px-2.5 py-2 md:hidden">
          <div className="mb-0.5 truncate font-mono text-[9px] uppercase tracking-[0.14em] text-fg-70">
            {entry.categoryLabel}
          </div>
          <div className="line-clamp-2 font-sans text-[11px] leading-[1.45] text-fg">{entry.title ?? entry.prompt}</div>
        </div>
      </Link>

      <div className="absolute left-2 top-2 transition-opacity">
        <SourceBadge source={entry.source} license={entry.attribution?.license} />
      </div>
      {entry.domains.length > 0 && (
        <div className="absolute right-2 top-2 hidden flex-wrap gap-1 opacity-0 transition-opacity group-hover:flex group-hover:opacity-100 group-focus-within:flex group-focus-within:opacity-100 md:flex md:opacity-0">
          {entry.domains.slice(0, 2).map((domain) => (
            <span
              key={domain}
              className="inline-block border border-border-strong bg-bg/80 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] backdrop-blur-sm"
            >
              {domain}
            </span>
          ))}
        </div>
      )}
      <div className="absolute bottom-2 right-2 hidden opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 md:block">
        <CopyPromptButton prompt={entry.prompt} lang={lang} />
      </div>
      <div className="border-t border-border-subtle p-2 md:hidden">
        <CopyPromptButton prompt={entry.prompt} lang={lang} className="w-full min-h-[34px] text-[9px]" />
      </div>
    </div>
  );
}
