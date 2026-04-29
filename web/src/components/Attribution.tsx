import type { AttributionData } from "@/lib/types";

export function Attribution({ attribution }: { attribution?: AttributionData }) {
  if (!attribution || attribution.license === "internal") {
    return <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-50">© VOIDLIGHT</p>;
  }

  return (
    <aside className="border-t border-border-subtle pt-4 space-y-2 font-sans text-sm leading-relaxed text-fg-70">
      <div>
        Source{" "}
        {attribution.sourceUrl ? (
          <a
            href={attribution.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="border-b border-border-subtle hover:text-fg"
          >
            {attribution.sourceName}
          </a>
        ) : (
          <span>{attribution.sourceName}</span>
        )}
      </div>
      <div>
        License{" "}
        {attribution.licenseUrl ? (
          <a
            href={attribution.licenseUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="border-b border-border-subtle hover:text-fg"
          >
            {attribution.license}
          </a>
        ) : (
          <span>{attribution.license}</span>
        )}
      </div>
      {attribution.firstPartyUrl && (
        <div>
          Original{" "}
          <a
            href={attribution.firstPartyUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="border-b border-border-subtle hover:text-fg break-all"
          >
            {attribution.firstPartyUrl}
          </a>
        </div>
      )}
      {(attribution.upstreamChain?.length ?? 0) > 1 && (
        <div className="break-all">Upstream · {attribution.upstreamChain.join(" → ")}</div>
      )}
      {attribution.indicationOfChanges && <div>{attribution.indicationOfChanges}</div>}
    </aside>
  );
}
