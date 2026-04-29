import type { Metadata } from "next";
import { SectionHome } from "@/components/sections/SectionHome";
import { getLatest, getManifest } from "@/lib/manifest";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `KO — ${SITE_NAME}` };

export default function KoHome() {
  const manifest = getManifest("ko");
  const latest = getLatest("ko", 12);
  return <SectionHome lang="ko" manifest={manifest} latest={latest} />;
}
