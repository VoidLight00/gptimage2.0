import { CategoryIndexView } from "@/components/sections/CategoryIndexView";
import { getCategories } from "@/lib/manifest";

export const metadata = { title: "Categories · KO — GPTIMAGE 2.0" };

export default function KoCategories() {
  return <CategoryIndexView lang="ko" categories={getCategories("ko")} />;
}
