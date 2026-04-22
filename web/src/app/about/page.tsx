export const metadata = { title: "About — GPTIMAGE 2.0" };

export default function About() {
  return (
    <div className="px-6 md:px-12 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-fg-50 mb-6">
          ― ABOUT
        </div>
        <h1
          className="font-mono font-light leading-[0.95] mb-12"
          style={{ fontSize: "clamp(48px, 10vw, 160px)", letterSpacing: "-0.02em" }}
        >
          ABOUT
        </h1>

        <div className="space-y-8 font-sans text-lg text-fg-70 leading-[1.7]">
          <p>
            <span className="text-fg">GPTIMAGE 2.0</span> 은 GPT 기반 이미지
            생성 작업물과 그 프롬프트를 카테고리별로 정리해 두는 아카이브입니다.
          </p>
          <p>
            모든 수록 항목에는 프롬프트가 첨부되어 있습니다. 프롬프트가 없는
            이미지는 수록되지 않습니다. 이는 재현 가능한 레시피로서의 가치를
            유지하기 위한 원칙입니다.
          </p>
          <p>
            좋은 프롬프트는 좋은 결과보다 드뭅니다. 여기는 그 레시피를 남기는
            곳입니다.
          </p>

          <div className="pt-8 border-t border-border-subtle font-mono text-[12px] uppercase tracking-[0.14em] text-fg-50 space-y-2">
            <div>Curated by VOIDLIGHT</div>
            <div>Design inspired by xAI</div>
            <div>Built with Next.js</div>
          </div>
        </div>
      </div>
    </div>
  );
}
