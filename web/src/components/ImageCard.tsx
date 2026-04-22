import Link from "next/link";
import Image from "next/image";
import type { PromptEntry } from "@/lib/types";

export function ImageCard({ entry }: { entry: PromptEntry }) {
  const aspect = entry.images.width / entry.images.height;
  return (
    <Link
      href={`/p/${entry.id}`}
      className="group block relative border border-border-subtle hover:border-border-strong overflow-hidden"
    >
      <div
        className="relative w-full bg-surface"
        style={{ aspectRatio: `${aspect}` }}
      >
        <Image
          src={entry.images.medium}
          alt={entry.prompt.slice(0, 100)}
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
          {entry.prompt}
        </div>
      </div>
    </Link>
  );
}
