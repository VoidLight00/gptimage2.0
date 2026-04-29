export type SourceFilter = "all" | "voidlight" | "curated";

export function normalizeSourceFilter(value?: string | null): SourceFilter {
  if (value === "voidlight" || value === "curated") {
    return value;
  }
  return "all";
}

export function matchesSourceFilter(source: string, filter: SourceFilter) {
  if (filter === "all") return true;
  if (filter === "voidlight") return source === "voidlight";
  return source !== "voidlight";
}
