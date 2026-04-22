import Link from "next/link";
import { getManifest } from "@/lib/manifest";

export const metadata = { title: "GPTIMAGE 2.0 — Choose Language" };

export default function Root() {
  const ko = getManifest("ko");
  const en = getManifest("en");
  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-4 md:px-12 py-16 md:py-24">
      <div className="mx-auto max-w-[1400px] w-full">
        <div className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-fg-50 mb-6 md:mb-10">
          ― PROMPT ARCHIVE BY VOIDLIGHT
        </div>
        <h1
          className="font-mono font-light text-fg leading-[0.9] mb-14 md:mb-24"
          style={{ fontSize: "clamp(48px, 14vw, 220px)", letterSpacing: "-0.02em" }}
        >
          GPTIMAGE
          <br />
          <span className="text-fg-50">2.0</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border-subtle border-y border-border-subtle">
          {/* KO */}
          <Link
            href="/ko"
            className="group p-8 md:p-14 hover:bg-surface-hover transition-colors min-h-[260px] flex flex-col"
          >
            <div className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.24em] text-fg-50 mb-4 md:mb-6">
              Section 01
            </div>
            <div
              className="font-mono font-light uppercase leading-none group-hover:text-fg-70 transition-colors"
              style={{ fontSize: "clamp(56px, 14vw, 120px)", letterSpacing: "-0.01em" }}
            >
              KO
            </div>
            <div className="mt-5 md:mt-6 font-sans text-fg-70 text-base md:text-lg">
              한국어 프롬프트
            </div>
            <div className="mt-6 md:mt-10 flex flex-wrap items-baseline gap-x-5 gap-y-2 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-fg-50">
              <div>
                <span className="text-fg text-xl md:text-2xl mr-1 tracking-tight font-light">
                  {ko.totalEntries}
                </span>
                entries
              </div>
              <div>
                <span className="text-fg text-xl md:text-2xl mr-1 tracking-tight font-light">
                  {ko.categories.length}
                </span>
                categories
              </div>
            </div>
            <div className="mt-6 md:mt-10 font-mono text-[11px] uppercase tracking-[0.2em] text-fg">
              Enter →
            </div>
          </Link>

          {/* EN */}
          <Link
            href="/en"
            className="group p-8 md:p-14 hover:bg-surface-hover transition-colors min-h-[260px] flex flex-col"
          >
            <div className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.24em] text-fg-50 mb-4 md:mb-6">
              Section 02
            </div>
            <div
              className="font-mono font-light uppercase leading-none group-hover:text-fg-70 transition-colors"
              style={{ fontSize: "clamp(56px, 14vw, 120px)", letterSpacing: "-0.01em" }}
            >
              EN
            </div>
            <div className="mt-5 md:mt-6 font-sans text-fg-70 text-base md:text-lg">
              GPT Image 2 · Community
            </div>
            <div className="mt-6 md:mt-10 flex flex-wrap items-baseline gap-x-5 gap-y-2 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-fg-50">
              <div>
                <span className="text-fg text-xl md:text-2xl mr-1 tracking-tight font-light">
                  {en.totalEntries}
                </span>
                entries
              </div>
              <div>
                <span className="text-fg text-xl md:text-2xl mr-1 tracking-tight font-light">
                  {en.categories.length}
                </span>
                categories
              </div>
            </div>
            <div className="mt-6 md:mt-10 font-mono text-[11px] uppercase tracking-[0.2em] text-fg">
              Enter →
            </div>
          </Link>
        </div>

        <p className="mt-10 md:mt-16 max-w-2xl font-sans text-fg-70 leading-relaxed text-[15px] md:text-base">
          섹션이 완전히 분리되어 있습니다. 한국어 마케팅 콘텐츠는 KO, 영어 커뮤니티 GPT Image 2
          컬렉션은 EN에서 관리됩니다.
        </p>
      </div>
    </div>
  );
}
