"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

export function Nav() {
  const pathname = usePathname() ?? "/";
  const lang: "ko" | "en" | null = pathname.startsWith("/ko")
    ? "ko"
    : pathname.startsWith("/en")
    ? "en"
    : null;

  return (
    <nav className="sticky top-0 z-40 bg-bg/95 backdrop-blur-sm border-b border-border-subtle">
      <div className="mx-auto max-w-[1400px] px-6 md:px-12 h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 hover:opacity-70 transition-opacity shrink-0">
          <Logo className="w-7 h-7" />
          <span className="font-mono text-[13px] uppercase tracking-[0.14em] leading-none">
            GPTIMAGE 2.0
          </span>
        </Link>

        {/* KO / EN 토글 */}
        <div className="flex items-center border border-border-strong divide-x divide-border-strong font-mono text-[11px] uppercase tracking-[0.14em]">
          <Link
            href="/ko"
            className={`px-4 py-2 ${lang === "ko" ? "bg-fg text-bg" : "text-fg hover:bg-surface-hover"}`}
          >
            KO
          </Link>
          <Link
            href="/en"
            className={`px-4 py-2 ${lang === "en" ? "bg-fg text-bg" : "text-fg hover:bg-surface-hover"}`}
          >
            EN
          </Link>
        </div>

        {lang && (
          <div className="hidden md:flex items-center gap-6 font-sans text-sm ml-auto">
            <Link href={`/${lang}/c`} className="text-fg">
              Categories
            </Link>
            <Link href={`/${lang}/search`} className="text-fg">
              Search
            </Link>
          </div>
        )}

        {lang && (
          <Link
            href={`/${lang}/c`}
            className="hidden md:inline-flex items-center px-5 py-2.5 bg-fg text-bg font-mono text-[12px] uppercase tracking-[0.14em] hover:bg-fg/90 transition-colors"
          >
            Browse
          </Link>
        )}
      </div>
    </nav>
  );
}
