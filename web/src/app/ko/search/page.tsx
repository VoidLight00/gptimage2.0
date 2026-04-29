import { Suspense } from "react";
import { buildSearchItems } from "@/lib/archive-search";
import { getManifest } from "@/lib/manifest";
import { SearchClient } from "./SearchClient";

export const metadata = { title: "Search · KO — GPTIMAGE 2.0" };

export default function Page() {
  const manifest = getManifest("ko");
  const items = buildSearchItems(manifest.entries);

  return (
    <div className="px-6 md:px-12 py-16 md:py-24">
      <div className="mx-auto max-w-[1400px]">
        <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-fg-50 mb-6">
          ― SEARCH · KO
        </div>
        <h1
          className="font-mono font-light leading-[0.95] mb-12"
          style={{ fontSize: "clamp(48px, 10vw, 160px)", letterSpacing: "-0.02em" }}
        >
          FIND
        </h1>
        <Suspense fallback={<div className="mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-50">Loading search…</div>}>
          <SearchClient items={items} lang="ko" />
        </Suspense>
      </div>
    </div>
  );
}
