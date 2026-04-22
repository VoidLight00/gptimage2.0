import { CategoryIndexView } from "@/components/sections/CategoryIndexView";
import { getCategories } from "@/lib/manifest";

export const metadata = { title: "Categories · EN — GPTIMAGE 2.0" };

export default function EnCategories() {
  return <CategoryIndexView lang="en" categories={getCategories("en")} />;
}
