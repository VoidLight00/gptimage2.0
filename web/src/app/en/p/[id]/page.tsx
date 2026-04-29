import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailView } from "@/components/sections/DetailView";
import { getEntry, getEntriesByCategory, getManifest } from "@/lib/manifest";
import { buildPromptMetadata } from "@/lib/page-metadata";

export function generateStaticParams() {
  return getManifest("en").entries.map((e) => ({ id: e.id }));
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params;
  const entry = getEntry("en", id);
  if (!entry) {
    return {
      title: "Not Found · EN — GPTIMAGE 2.0",
      description: "The requested prompt could not be found.",
    };
  }
  return buildPromptMetadata("en", entry);
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const entry = getEntry("en", id);
  if (!entry) notFound();
  const related = getEntriesByCategory("en", entry.category)
    .filter((e) => e.id !== entry.id)
    .slice(0, 8);
  return <DetailView entry={entry} related={related} lang="en" />;
}
