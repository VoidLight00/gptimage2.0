import Link from "next/link";
import { getManifest } from "@/lib/manifest";

export const metadata = { title: "GPTIMAGE 2.0 — Choose Language" };

export default function Root() {
  const ko = getManifest("ko");
  const en = getManifest("en");
  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-6 md:px-12 py-24">
      <div className="mx-auto max-w-[1400px] w-full">
        <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-fg-50 mb-10">
          ― PROMPT ARCHIVE BY VOIDLIGHT
        </div>
        <h1
          className="font-mono font-light text-fg leading-[0.9] mb-24"
          style={{ fontSize: "clamp(56px, 14vw, 220px)", letterSpacing: "-0.02em" }}
        >
          GPTIMAGE
          <br />
          <span className="text-fg-50">2.0</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border-subtle border-y border-border-subtle">
          {/* KO */}
          <Link
            href="/ko"
            className="group p-10 md:p-14 hover:bg-surface-hover transition-colors"
          >
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-50 mb-6">
              Section 01
            </div>
            <div
              className="font-mono font-light uppercase leading-none group-hover:text-fg-70 transition-colors"
              style={{ fontSize: "clamp(48px, 10vw, 120px)", letterSpacing: "-0.01em" }}
            >
              KO
            </div>
            <div className="mt-6 font-sans text-fg-70 text-lg">한국어 프롬프트</div>
            <div className="mt-10 flex items-baseline gap-6 font-mono text-[11px] uppercase tracking-[0.18em] text-fg-50">
              <div>
                <span className="text-fg text-2xl mr-1 tracking-tight font-light">
                  {ko.totalEntries}
                </span>
                entries
              </div>
              <div>
                <span className="text-fg text-2xl mr-1 tracking-tight font-light">
                  {ko.categories.length}
                </span>
                categories
              </div>
            </div>
            <div className="mt-10 font-mono text-[11px] uppercase tracking-[0.2em] text-fg">
              Enter →
            </div>
          </Link>

          {/* EN */}
          <Link
            href="/en"
            className="group p-10 md:p-14 hover:bg-surface-hover transition-colors"
          >
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-fg-50 mb-6">
              Section 02
            </div>
            <div
              className="font-mono font-light uppercase leading-none group-hover:text-fg-70 transition-colors"
              style={{ fontSize: "clamp(48px, 10vw, 120px)", letterSpacing: "-0.01em" }}
            >
              EN
            </div>
            <div className="mt-6 font-sans text-fg-70 text-lg">
              GPT Image 2 · Community Prompts
            </div>
            <div className="mt-10 flex items-baseline gap-6 font-mono text-[11px] uppercase tracking-[0.18em] text-fg-50">
              <div>
                <span className="text-fg text-2xl mr-1 tracking-tight font-light">
                  {en.totalEntries}
                </span>
                entries
              </div>
              <div>
                <span className="text-fg text-2xl mr-1 tracking-tight font-light">
                  {en.categories.length}
                </span>
                categories
              </div>
            </div>
            <div className="mt-10 font-mono text-[11px] uppercase tracking-[0.2em] text-fg">
              Enter →
            </div>
          </Link>
        </div>

        <p className="mt-16 max-w-2xl font-sans text-fg-70 leading-relaxed">
          섹션이 완전히 분리되어 있습니다. 한국어 마케팅 콘텐츠는 KO, 영어 커뮤니티
          GPT Image 2 컬렉션은 EN에서 관리됩니다. 두 섹션은 카테고리 체계와 카드
          레이아웃은 같지만 데이터는 독립됩니다.
        </p>
      </div>
    </div>
  );
}
