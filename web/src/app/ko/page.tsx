import { SectionHome } from "@/components/sections/SectionHome";
import { getLatest, getManifest } from "@/lib/manifest";

export const metadata = { title: "KO — GPTIMAGE 2.0" };

export default function KoHome() {
  const manifest = getManifest("ko");
  const latest = getLatest("ko", 12);
  return <SectionHome lang="ko" manifest={manifest} latest={latest} />;
}
