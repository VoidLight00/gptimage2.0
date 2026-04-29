import { getManifest } from "@/lib/manifest";

function summarizeExternalSources() {
  const entries = [...getManifest("ko").entries, ...getManifest("en").entries].filter(
    (entry) => entry.attribution && entry.attribution.license !== "internal"
  );

  const bySource = new Map<
    string,
    {
      sourceName: string;
      license: string;
      licenseUrl?: string;
      sourceUrl?: string;
      firstPartyUrl?: string;
      upstreamChain: string[];
      indicationOfChanges?: string;
      count: number;
    }
  >();

  entries.forEach((entry) => {
    const attribution = entry.attribution!;
    const key = `${attribution.sourceName}-${attribution.license}`;
    const current = bySource.get(key);
    bySource.set(key, {
      sourceName: attribution.sourceName ?? "External",
      license: attribution.license,
      licenseUrl: attribution.licenseUrl,
      sourceUrl: attribution.sourceUrl,
      firstPartyUrl: attribution.firstPartyUrl,
      upstreamChain: attribution.upstreamChain ?? [],
      indicationOfChanges: attribution.indicationOfChanges,
      count: (current?.count ?? 0) + 1,
    });
  });

  return Array.from(bySource.values()).sort((a, b) => b.count - a.count);
}

export const metadata = { title: "License — GPTIMAGE 2.0" };

export default function LicensePage() {
  const sources = summarizeExternalSources();

  return (
    <div className="px-4 md:px-12 py-16 md:py-24">
      <div className="mx-auto max-w-[1400px]">
        <div className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-fg-50 mb-6">
          ― LICENSE
        </div>
        <h1
          className="font-mono font-light leading-[0.95] mb-10"
          style={{ fontSize: "clamp(42px, 10vw, 160px)", letterSpacing: "-0.02em" }}
        >
          LICENSE
        </h1>
        <p className="max-w-3xl font-sans text-base md:text-lg text-fg-70 leading-relaxed mb-12">
          GPTIMAGE 2.0는 VOIDLIGHT 원본 컬렉션과 외부 CC BY 자료를 함께 보관합니다. 외부 엔트리는
          원작 출처, 라이선스, 변경 고지를 상세 페이지와 이 페이지에서 함께 제공합니다.
        </p>

        <div className="overflow-x-auto border border-border-subtle">
          <table className="min-w-full divide-y divide-border-subtle font-sans text-sm">
            <thead className="bg-surface">
              <tr className="text-left">
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-50">Source</th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-50">License</th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-50">Original</th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-50">Changes</th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-50">Entries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {sources.map((source) => (
                <tr key={`${source.sourceName}-${source.license}`}>
                  <td className="px-4 py-4 align-top">
                    <div className="font-medium text-fg">{source.sourceName}</div>
                    {source.sourceUrl && (
                      <a
                        href={source.sourceUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-1 inline-block break-all text-fg-70 border-b border-border-subtle hover:text-fg"
                      >
                        {source.sourceUrl}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top">
                    {source.licenseUrl ? (
                      <a
                        href={source.licenseUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="border-b border-border-subtle hover:text-fg"
                      >
                        {source.license}
                      </a>
                    ) : (
                      source.license
                    )}
                  </td>
                  <td className="px-4 py-4 align-top">
                    {source.firstPartyUrl ? (
                      <a
                        href={source.firstPartyUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="break-all border-b border-border-subtle hover:text-fg"
                      >
                        {source.firstPartyUrl}
                      </a>
                    ) : (
                      <span className="text-fg-50">—</span>
                    )}
                    {(source.upstreamChain?.length ?? 0) > 1 && (
                      <div className="mt-2 text-fg-50 break-all">{source.upstreamChain.join(" → ")}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top text-fg-70">
                    {source.indicationOfChanges ?? "Re-curated and rehosted by VOIDLIGHT; prompt content unchanged."}
                  </td>
                  <td className="px-4 py-4 align-top font-mono text-[12px] uppercase tracking-[0.14em] text-fg-50">
                    {source.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
