"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Fuse from "fuse.js";

type Item = {
  id: string;
  prompt: string;
  category: string;
  categoryLabel: string;
  tags: string[];
  model: string;
  thumb: string;
  blur: string;
  w: number;
  h: number;
};

export function SearchClient({ items, lang }: { items: Item[]; lang: "ko" | "en" }) {
  const [q, setQ] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: [
          { name: "prompt", weight: 0.6 },
          { name: "tags", weight: 0.2 },
          { name: "categoryLabel", weight: 0.1 },
          { name: "model", weight: 0.1 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [items]
  );

  const results = q.trim()
    ? fuse.search(q).slice(0, 48).map((r) => r.item)
    : items.slice(0, 48);

  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search prompts, tags..."
        className="w-full bg-transparent border-b border-border-strong px-0 py-4 md:py-5 font-sans text-xl md:text-3xl text-fg placeholder:text-fg-30 focus:outline-none focus:border-fg"
        autoFocus
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        inputMode="search"
      />
      <div className="mt-5 md:mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-50">
        {q.trim()
          ? `${results.length} match${results.length === 1 ? "" : "es"}`
          : `${items.length} total`}
      </div>

      <div className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
        {results.map((e) => (
          <Link
            key={e.id}
            href={`/${lang}/p/${e.id}`}
            className="group block border border-border-subtle hover:border-border-strong"
          >
            <div
              className="relative w-full bg-surface"
              style={{ aspectRatio: `${e.w}/${e.h}` }}
            >
              <Image
                src={e.thumb}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, 300px"
                placeholder="blur"
                blurDataURL={e.blur}
                className="object-cover"
              />
            </div>
            <div className="p-2.5 md:p-3 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.12em] text-fg-50">
              <div className="truncate">{e.categoryLabel}</div>
              <div className="mt-1 line-clamp-2 text-fg-70 normal-case tracking-normal font-sans text-[11.5px] md:text-[12px]">
                {e.prompt}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {q.trim() && results.length === 0 && (
        <div className="mt-10 md:mt-12 border border-border-subtle bg-surface p-10 md:p-12 font-mono text-[13px] uppercase tracking-[0.14em] text-fg-50">
          No results.
        </div>
      )}
    </div>
  );
}
