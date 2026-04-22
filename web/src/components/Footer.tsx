import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border-subtle mt-24">
      <div className="mx-auto max-w-[1400px] px-6 md:px-12 py-16 flex flex-col md:flex-row md:items-end md:justify-between gap-10">
        <div className="flex items-center gap-4">
          <Logo className="w-10 h-10" />
          <div>
            <div className="font-mono text-[12px] uppercase tracking-[0.14em] text-fg-50">
              An archive by
            </div>
            <div className="font-mono text-lg tracking-[0.14em] uppercase mt-1">
              VOIDLIGHT
            </div>
          </div>
        </div>

        <div className="flex flex-col md:items-end gap-3 font-mono text-[12px] uppercase tracking-[0.1em] text-fg-50">
          <div className="flex gap-6 flex-wrap">
            <Link href="/">Home</Link>
            <Link href="/ko">KO</Link>
            <Link href="/en">EN</Link>
          </div>
          <div>© {new Date().getFullYear()} VOIDLIGHT · GPTIMAGE 2.0</div>
        </div>
      </div>
    </footer>
  );
}
