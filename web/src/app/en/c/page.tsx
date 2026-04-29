import type { Metadata } from "next";
import { CategoryIndexView } from "@/components/sections/CategoryIndexView";
import { getCategories } from "@/lib/manifest";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: `Categories · EN — ${SITE_NAME}` };

export default function EnCategories() {
  return <CategoryIndexView lang="en" categories={getCategories("en")} />;
}
