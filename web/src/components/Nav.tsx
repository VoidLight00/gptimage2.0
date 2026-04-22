import Link from "next/link";
import { Logo } from "./Logo";

export function Nav() {
  return (
    <nav className="sticky top-0 z-40 bg-bg/95 backdrop-blur-sm border-b border-border-subtle">
      <div className="mx-auto max-w-[1400px] px-6 md:px-12 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
          <Logo className="w-7 h-7" />
          <span className="font-mono text-[13px] uppercase tracking-[0.14em] leading-none">
            GPTIMAGE 2.0
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-sans text-sm">
          <Link href="/c" className="text-fg">
            Categories
          </Link>
          <Link href="/search" className="text-fg">
            Search
          </Link>
          <Link href="/about" className="text-fg">
            About
          </Link>
        </div>

        <Link
          href="/c"
          className="hidden md:inline-flex items-center px-5 py-2.5 bg-fg text-bg font-mono text-[12px] uppercase tracking-[0.14em] hover:bg-fg/90 transition-colors"
        >
          Browse All
        </Link>

        <Link
          href="/c"
          aria-label="Browse categories"
          className="md:hidden font-mono text-[12px] uppercase tracking-[0.14em] px-3 py-2 border border-border-strong"
        >
          Menu
        </Link>
      </div>
    </nav>
  );
}
