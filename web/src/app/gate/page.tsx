import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import GateForm from "./GateForm";

export const metadata = { title: "ACCESS — GPTIMAGE 2.0" };
export const dynamic = "force-dynamic";

async function attempt(formData: FormData) {
  "use server";
  const raw = String(formData.get("cmd") || "").trim();
  const next = String(formData.get("next") || "/");
  const expected = process.env.SITE_PASSWORD?.trim();
  if (!expected || raw !== expected) {
    redirect(`/gate?next=${encodeURIComponent(next)}&err=1`);
  }
  const jar = await cookies();
  jar.set("gptimage-cmd", expected, {
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
  });
  redirect(next.startsWith("/") ? next : "/");
}

export default async function GatePage(props: {
  searchParams: Promise<{ next?: string; err?: string }>;
}) {
  const sp = await props.searchParams;
  const next = sp.next ?? "/";
  const err = sp.err === "1";

  // 설정 안 됐으면 바로 홈으로
  if (!process.env.SITE_PASSWORD?.trim()) redirect("/");

  return (
    <div className="min-h-[100vh] flex items-center justify-center px-4 py-16 bg-bg">
      <div className="w-full max-w-xl">
        <div className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-fg-50 mb-6">
          ― RESTRICTED ACCESS
        </div>
        <h1
          className="font-mono font-light uppercase mb-10"
          style={{ fontSize: "clamp(40px, 10vw, 96px)", letterSpacing: "-0.02em", lineHeight: 0.95 }}
        >
          ENTER
          <br />
          <span className="text-fg-50">PASSWORD</span>
        </h1>

        <GateForm action={attempt} next={next} err={err} />

        <div className="mt-10 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.24em] text-fg-50 space-y-2">
          <div>{"// private archive by VOIDLIGHT"}</div>
          <div>{"// password is granted to authorized users"}</div>
        </div>
      </div>
    </div>
  );
}
