import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 사이트 전체를 비밀번호로 게이트.
// 접근 방법 1: URL에 ?cmd=<PASSWORD>  → 쿠키 심고 리다이렉트
// 접근 방법 2: /gate 에서 CMD 입력 (cookie 발행)
// 쿠키명: gptimage-cmd

const COOKIE = "gptimage-cmd";
const MAX_AGE = 60 * 60 * 24 * 30; // 30일

function expected(): string | null {
  return process.env.SITE_PASSWORD?.trim() || null;
}

function passthroughWithPath(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const pass = expected();
  if (!pass) return passthroughWithPath(req); // 미설정 시 우회

  // /gate, _next 등 항상 통과
  if (
    nextUrl.pathname.startsWith("/gate") ||
    nextUrl.pathname.startsWith("/_next") ||
    nextUrl.pathname.startsWith("/api") ||
    nextUrl.pathname === "/license" ||
    nextUrl.pathname === "/about" ||
    nextUrl.pathname === "/robots.txt" ||
    nextUrl.pathname === "/sitemap.xml" ||
    nextUrl.pathname === "/favicon.ico" ||
    nextUrl.pathname.startsWith("/brand") ||
    nextUrl.pathname.startsWith("/images") ||
    nextUrl.pathname.startsWith("/images-en")
  ) {
    return passthroughWithPath(req);
  }

  // URL 쿼리 ?cmd=xxx 로 접근 시 쿠키 세팅
  const cmd = nextUrl.searchParams.get("cmd");
  if (cmd && cmd === pass) {
    const url = new URL(nextUrl.pathname, nextUrl.origin);
    const res = NextResponse.redirect(url);
    res.cookies.set(COOKIE, pass, {
      maxAge: MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
    return res;
  }

  // 쿠키 확인
  const cookie = req.cookies.get(COOKIE)?.value;
  if (cookie === pass) return passthroughWithPath(req);

  // 게이트로 리다이렉트
  const gate = new URL("/gate", nextUrl.origin);
  gate.searchParams.set("next", nextUrl.pathname + nextUrl.search);
  return NextResponse.redirect(gate);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
