import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] px-6 md:px-12 py-16 md:py-24 flex items-center">
      <div className="mx-auto max-w-3xl w-full border border-border-subtle bg-surface p-8 md:p-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-fg-50 mb-6">― 404 · EN</div>
        <h1
          className="font-mono font-light leading-[0.95] mb-6"
          style={{ fontSize: "clamp(48px, 10vw, 120px)", letterSpacing: "-0.02em" }}
        >
          NOT FOUND
        </h1>
        <p className="max-w-xl font-sans text-base md:text-lg text-fg-70 leading-relaxed">
          The prompt or page you requested could not be found. Try search or browse the archive again.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/en/search"
            className="inline-flex items-center px-6 py-3 min-h-[44px] bg-fg text-bg font-mono text-[12px] uppercase tracking-[0.14em]"
          >
            Search EN
          </Link>
          <Link
            href="/en/c"
            className="inline-flex items-center px-6 py-3 min-h-[44px] border border-border-strong font-mono text-[12px] uppercase tracking-[0.14em]"
          >
            Browse Categories
          </Link>
        </div>
      </div>
    </div>
  );
}
