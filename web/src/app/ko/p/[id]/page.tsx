import { notFound } from "next/navigation";
import { getEntry, getEntriesByCategory, getManifest } from "@/lib/manifest";
import { DetailView } from "@/components/sections/DetailView";

export function generateStaticParams() {
  return getManifest("ko").entries.map((e) => ({ id: e.id }));
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
