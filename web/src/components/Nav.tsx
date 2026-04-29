"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

function getCopy(lang: "ko" | "en" | null) {
  if (lang === "ko") {
    return {
      categories: "카테고리",
      search: "검색",
      about: "소개",
      license: "라이선스",
      home: "홈",
      openMenu: "메뉴 열기",
      closeMenu: "메뉴 닫기",
    };
  }

  return {
    categories: "Categories",
    search: "Search",
    about: "About",
    license: "License",
    home: "Home",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  };
}

export function Nav() {
  const pathname = usePathname() ?? "/";
  const lang: "ko" | "en" | null = pathname.startsWith("/ko")
    ? "ko"
    : pathname.startsWith("/en")
    ? "en"
    : null;
  const copy = getCopy(lang);

  const [menuRoute, setMenuRoute] = useState<string | null>(null);
  const menuOpen = menuRoute === pathname;

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <nav className="sticky top-0 z-40 bg-bg/95 backdrop-blur-sm border-b border-border-subtle">
        <div className="mx-auto max-w-[1400px] px-4 md:px-12 h-14 md:h-16 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 md:gap-3 hover:opacity-70 transition-opacity shrink-0 min-w-0"
          >
            <Logo className="w-6 h-6 md:w-7 md:h-7" />
            <span className="font-mono text-[11px] md:text-[13px] uppercase tracking-[0.14em] leading-none truncate">
              GPTIMAGE 2.0
            </span>
          </Link>

          {/* KO/EN 토글 — 모바일에서도 노출 (제일 중요한 분기점) */}
          <div className="flex items-center border border-border-strong divide-x divide-border-strong font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em] shrink-0">
            <Link
              href="/ko"
              className={`px-3 md:px-4 py-2 min-h-[36px] flex items-center ${
                lang === "ko" ? "bg-fg text-bg" : "text-fg hover:bg-surface-hover"
              }`}
            >
              KO
            </Link>
            <Link
              href="/en"
              className={`px-3 md:px-4 py-2 min-h-[36px] flex items-center ${
                lang === "en" ? "bg-fg text-bg" : "text-fg hover:bg-surface-hover"
              }`}
            >
              EN
            </Link>
          </div>

          {/* 데스크톱: 인라인 메뉴 */}
          {lang && (
            <div className="hidden md:flex items-center gap-6 font-sans text-sm ml-auto">
              <Link href={`/${lang}/c`} className="text-fg hover:text-fg-70">
                {copy.categories}
              </Link>
              <Link href={`/${lang}/search`} className="text-fg hover:text-fg-70">
                {copy.search}
              </Link>
              <Link href="/about" className="text-fg hover:text-fg-70">
                {copy.about}
              </Link>
              <Link href="/license" className="text-fg hover:text-fg-70">
                {copy.license}
              </Link>
            </div>
          )}

          {/* 모바일: 햄버거 */}
          {lang && (
            <button
              type="button"
              aria-label={menuOpen ? copy.closeMenu : copy.openMenu}
              aria-expanded={menuOpen}
              onClick={() => setMenuRoute((current) => (current === pathname ? null : pathname))}
              className="md:hidden w-11 h-11 flex flex-col items-center justify-center gap-[5px] border border-border-strong shrink-0"
            >
              <span
                className={`block w-4 h-[1.5px] bg-fg transition-transform ${
                  menuOpen ? "translate-y-[6.5px] rotate-45" : ""
                }`}
              />
              <span
                className={`block w-4 h-[1.5px] bg-fg transition-opacity ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block w-4 h-[1.5px] bg-fg transition-transform ${
                  menuOpen ? "-translate-y-[6.5px] -rotate-45" : ""
                }`}
              />
            </button>
          )}
        </div>
      </nav>

      {/* 모바일 오버레이 메뉴 */}
      {lang && menuOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 bottom-0 z-30 bg-bg border-t border-border-subtle flex flex-col overflow-y-auto">
          <Link
            href={`/${lang}`}
            onClick={() => setMenuRoute(null)}
            className="px-6 py-8 border-b border-border-subtle font-mono uppercase tracking-[-0.01em] hover:bg-surface-hover flex items-baseline justify-between"
          >
            <span className="font-light" style={{ fontSize: "clamp(40px, 10vw, 56px)" }}>
              {copy.home}
            </span>
            <span className="text-fg-50 text-[11px] tracking-[0.2em]">{lang.toUpperCase()} →</span>
          </Link>
          <Link
            href={`/${lang}/c`}
            onClick={() => setMenuRoute(null)}
            className="px-6 py-8 border-b border-border-subtle font-mono uppercase hover:bg-surface-hover flex items-baseline justify-between"
          >
            <span className="font-light" style={{ fontSize: "clamp(40px, 10vw, 56px)" }}>
              {copy.categories}
            </span>
            <span className="text-fg-50 text-[11px] tracking-[0.2em]">→</span>
          </Link>
          <Link
            href={`/${lang}/search`}
            onClick={() => setMenuRoute(null)}
            className="px-6 py-8 border-b border-border-subtle font-mono uppercase hover:bg-surface-hover flex items-baseline justify-between"
          >
            <span className="font-light" style={{ fontSize: "clamp(40px, 10vw, 56px)" }}>
              {copy.search}
            </span>
            <span className="text-fg-50 text-[11px] tracking-[0.2em]">→</span>
          </Link>
          <Link
            href="/about"
            onClick={() => setMenuRoute(null)}
            className="px-6 py-8 border-b border-border-subtle font-mono uppercase hover:bg-surface-hover flex items-baseline justify-between"
          >
            <span className="font-light" style={{ fontSize: "clamp(40px, 10vw, 56px)" }}>
              {copy.about}
            </span>
            <span className="text-fg-50 text-[11px] tracking-[0.2em]">→</span>
          </Link>
          <Link
            href="/license"
            onClick={() => setMenuRoute(null)}
            className="px-6 py-8 border-b border-border-subtle font-mono uppercase hover:bg-surface-hover flex items-baseline justify-between"
          >
            <span className="font-light" style={{ fontSize: "clamp(40px, 10vw, 56px)" }}>
              {copy.license}
            </span>
            <span className="text-fg-50 text-[11px] tracking-[0.2em]">→</span>
          </Link>

          <div className="mt-auto p-6 font-mono text-[10px] uppercase tracking-[0.24em] text-fg-50">
            © VOIDLIGHT · GPTIMAGE 2.0
          </div>
        </div>
      )}
    </>
  );
}
