import type { AttributionData } from "@/lib/types";

function safeExternalUrl(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? value : undefined;
  } catch {
    return undefined;
  }
}

export function Attribution({ attribution }: { attribution?: AttributionData }) {
  if (!attribution || attribution.license === "internal") {
    return <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-50">© VOIDLIGHT</p>;
  }

  const sourceUrl = safeExternalUrl(attribution.sourceUrl);
  const licenseUrl = safeExternalUrl(attribution.licenseUrl);
  const firstPartyUrl = safeExternalUrl(attribution.firstPartyUrl);

  return (
    <aside className="border-t border-border-subtle pt-4 space-y-3">
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-50 mb-1">Source</div>
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="font-sans text-[13px] text-fg-70 hover:text-fg border-b border-border-subtle"
            >
              {attribution.sourceName ?? sourceUrl}
            </a>
          ) : (
            <span className="font-sans text-[13px] text-fg-70">{attribution.sourceName}</span>
          )}
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-50 mb-1">License</div>
          {licenseUrl ? (
            <a
              href={licenseUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="font-sans text-[13px] text-fg-70 hover:text-fg border-b border-border-subtle"
            >
              {attribution.license}
            </a>
          ) : (
            <span className="font-sans text-[13px] text-fg-70">{attribution.license}</span>
          )}
        </div>
      </div>
      {firstPartyUrl && (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-50 mb-1">Original</div>
          <a
            href={firstPartyUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="font-sans text-[13px] text-fg-70 hover:text-fg border-b border-border-subtle break-all"
          >
            {firstPartyUrl}
          </a>
        </div>
      )}
      {(attribution.upstreamChain?.length ?? 0) > 1 && (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-50 mb-1">Upstream</div>
          <div className="font-sans text-[13px] text-fg-60 break-all">{attribution.upstreamChain.join(" → ")}</div>
        </div>
      )}
      {attribution.indicationOfChanges && (
        <div className="font-sans text-[12px] text-fg-50 italic">{attribution.indicationOfChanges}</div>
      )}
    </aside>
  );
}
