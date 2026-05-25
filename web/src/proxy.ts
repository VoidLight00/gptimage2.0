import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 사이트 전체를 비밀번호로 게이트.
// 접근 방법 1: URL에 ?cmd=<PASSWORD>  → 쿠키 심고 리다이렉트
// 접근 방법 2: /gate 에서 CMD 입력 (cookie 발행)
// 쿠키명: gptimage-cmd

const COOKIE = "gptimage-cmd";
const MAX_AGE = 60 * 60 * 24 * 30; // 30일

// Paths that are intentionally public — must stay indexable.
const PUBLIC_PATHS = new Set(["/about", "/license", "/robots.txt", "/sitemap.xml", "/favicon.ico"]);
const PUBLIC_PREFIXES = ["/_next", "/api", "/gate", "/brand", "/images", "/images-en"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function allowedPasswords() {
  return [process.env.SITE_PASSWORD, process.env.SITE_PASSWORDS]
    .flatMap((value) => value?.split(/[\n,]/) ?? [])
    .map((value) => value.trim())
    .filter(Boolean);
}

function cookieValue(value: string) {
  return encodeURIComponent(value);
}

function isAllowed(value?: string) {
  if (!value) return false;
  const decoded = decodeURIComponent(value);
  return allowedPasswords().includes(decoded);
}

// Tag the response as private archive content so search engines (and CDN
// share-caches that honor X-Robots-Tag) never index it.
function withPrivacyHeaders(res: NextResponse, pathname: string) {
  if (!isPublicPath(pathname)) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
}

export function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const passwords = allowedPasswords();
  if (passwords.length === 0) return NextResponse.next(); // 미설정 시 우회

  // /gate, _next, /about, /license 등은 항상 통과 (단 noindex 태그는 path 기반으로 처리)
  if (isPublicPath(nextUrl.pathname)) {
    return withPrivacyHeaders(NextResponse.next(), nextUrl.pathname);
  }

  // URL 쿼리 ?cmd=xxx 로 접근 시 쿠키 세팅
  const cmd = nextUrl.searchParams.get("cmd")?.trim();
  if (cmd && isAllowed(cmd)) {
    const url = new URL(nextUrl.pathname, nextUrl.origin);
    const res = NextResponse.redirect(url);
    res.cookies.set(COOKIE, cookieValue(cmd), {
      maxAge: MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
    return withPrivacyHeaders(res, nextUrl.pathname);
  }

  // 쿠키 확인
  const cookie = req.cookies.get(COOKIE)?.value;
  if (isAllowed(cookie)) {
    return withPrivacyHeaders(NextResponse.next(), nextUrl.pathname);
  }

  // 게이트로 리다이렉트
  const gate = new URL("/gate", nextUrl.origin);
  gate.searchParams.set("next", nextUrl.pathname + nextUrl.search);
  return withPrivacyHeaders(NextResponse.redirect(gate), nextUrl.pathname);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
