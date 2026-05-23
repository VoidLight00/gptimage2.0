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

function getLicenseLabel(value: string) {
  if (value === "internal") {
    return "VOIDLIGHT first-party";
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 80 ? `${normalized.slice(0, 77)}…` : normalized;
}

export function Attribution({ attribution }: { attribution?: AttributionData }) {
  const data: AttributionData = attribution ?? {
    license: "internal",
    sourceName: "VOIDLIGHT",
    upstreamChain: [],
  };
  const isInternal = data.license === "internal";
  const licenseLabel = getLicenseLabel(data.license);
  const sourceUrl = isInternal ? undefined : safeExternalUrl(data.sourceUrl);
  const licenseUrl = safeExternalUrl(data.licenseUrl);
  const firstPartyUrl = safeExternalUrl(data.firstPartyUrl);

  return (
    <aside className="border-t border-border-subtle pt-4 space-y-3">
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-50 mb-1">{isInternal ? "Creator" : "Source"}</div>
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="font-sans text-[13px] text-fg-70 hover:text-fg border-b border-border-subtle"
            >
              {data.sourceName ?? sourceUrl}
            </a>
          ) : (
            <span className="font-sans text-[13px] text-fg-70">{data.sourceName ?? "VOIDLIGHT"}</span>
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
              {licenseLabel}
            </a>
          ) : (
            <span className="font-sans text-[13px] text-fg-70">{licenseLabel}</span>
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
      {data.upstreamChain.length > 1 && (
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-50 mb-1">Upstream</div>
          <div className="font-sans text-[13px] text-fg-60 break-all">{data.upstreamChain.join(" → ")}</div>
        </div>
      )}
      {data.indicationOfChanges && (
        <div className="font-sans text-[12px] text-fg-50 italic">{data.indicationOfChanges}</div>
      )}
    </aside>
  );
}
