import type { Metadata } from "next";
import { CategoryIndexView } from "@/components/sections/CategoryIndexView";
import { getCategories } from "@/lib/manifest";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `Categories · KO — ${SITE_NAME}` };

export default function KoCategories() {
  return <CategoryIndexView lang="ko" categories={getCategories("ko")} />;
}
