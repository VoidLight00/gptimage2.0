import Link from "next/link";
import Image from "next/image";
import type { PromptEntry } from "@/lib/types";

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
    <Link
      href={`/${lang}/p/${entry.id}`}
      className="group block relative border border-border-subtle hover:border-border-strong overflow-hidden"
    >
      <div
        className="relative w-full bg-surface"
        style={{ aspectRatio: `${aspect}` }}
      >
        <Image
          src={entry.images.medium}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          placeholder="blur"
          blurDataURL={entry.images.blurDataURL}
          className="object-cover"
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg/95 via-bg/70 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-50 mb-1">
          {entry.categoryLabel} · {entry.id}
        </div>
        <div className="font-mono text-[12px] text-fg line-clamp-2 leading-[1.5]">
          {entry.title ?? entry.prompt}
        </div>
      </div>
      {entry.domains && entry.domains.length > 0 && (
        <div className="absolute top-2 right-2 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {entry.domains.slice(0, 2).map((d) => (
            <span
              key={d}
              className="inline-block bg-bg/80 backdrop-blur-sm border border-border-strong px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]"
            >
              {d}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
