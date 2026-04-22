import { SectionHome } from "@/components/sections/SectionHome";
import { getLatest, getManifest } from "@/lib/manifest";

export const metadata = { title: "EN — GPTIMAGE 2.0" };

export default function EnHome() {
  const manifest = getManifest("en");
  const latest = getLatest("en", 12);
  return <SectionHome lang="en" manifest={manifest} latest={latest} />;
}
