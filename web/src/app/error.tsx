"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] px-6 md:px-12 py-16 md:py-24 flex items-center">
      <div className="mx-auto max-w-3xl w-full border border-border-subtle bg-surface p-8 md:p-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-fg-50 mb-6">― ERROR</div>
        <h1
          className="font-mono font-light leading-[0.95] mb-6"
          style={{ fontSize: "clamp(48px, 10vw, 120px)", letterSpacing: "-0.02em" }}
        >
          SOMETHING WENT WRONG
        </h1>
        <p className="max-w-xl font-sans text-base md:text-lg text-fg-70 leading-relaxed">
          일시적인 렌더링 오류가 발생했습니다. 다시 시도하거나 아카이브 홈으로 돌아가 주세요.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="inline-flex items-center px-6 py-3 min-h-[44px] bg-fg text-bg font-mono text-[12px] uppercase tracking-[0.14em]"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 min-h-[44px] border border-border-strong font-mono text-[12px] uppercase tracking-[0.14em]"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
