import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailView } from "@/components/sections/DetailView";
import { getEntry, getEntriesByCategory, getManifest } from "@/lib/manifest";
import { buildPromptMetadata } from "@/lib/page-metadata";

export function generateStaticParams() {
  return getManifest("ko").entries.map((e) => ({ id: e.id }));
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params;
  const entry = getEntry("ko", id);
  if (!entry) {
    return {
      title: "Not Found · KO — GPTIMAGE 2.0",
      description: "요청한 프롬프트를 찾을 수 없습니다.",
    };
  }
  return buildPromptMetadata("ko", entry);
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const entry = getEntry("ko", id);
  if (!entry) notFound();
  const related = getEntriesByCategory("ko", entry.category)
    .filter((e) => e.id !== entry.id)
    .slice(0, 8);
  return <DetailView entry={entry} related={related} lang="ko" />;
}
