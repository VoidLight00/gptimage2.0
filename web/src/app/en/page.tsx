import type { Metadata } from "next";
import { SectionHome } from "@/components/sections/SectionHome";
import { getLatest, getManifest } from "@/lib/manifest";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `EN — ${SITE_NAME}` };

export default function EnHome() {
  const manifest = getManifest("en");
  const latest = getLatest("en", 12);
  return <SectionHome lang="en" manifest={manifest} latest={latest} />;
}
