import type { PromptEntry } from "./types";
import { matchesSourceFilter, type SourceFilter } from "./archive-filters";

export type SearchItem = {
  id: string;
  language: "ko" | "en";
  title?: string | null;
  prompt: string;
  category: string;
  categoryLabel: string;
  tags: string[];
  model: string;
  thumb: string;
  blur?: string;
  w: number;
  h: number;
  source: string;
  license?: string;
  domains: string[];
  formats: string[];
  createdAt: string;
};

export type SearchSort = "latest" | "title";

export type SearchFilterOption = {
  value: string;
  label: string;
  count: number;
};

export function normalizeSearchSort(value?: string | null): SearchSort {
  return value === "title" ? "title" : "latest";
}

export function mapEntryToSearchItem(entry: PromptEntry): SearchItem {
  return {
    id: entry.id,
    language: entry.language,
    title: entry.title ?? null,
    prompt: entry.prompt,
    category: entry.category,
    categoryLabel: entry.categoryLabel,
    tags: entry.tags,
    model: entry.model ?? "",
    thumb: entry.images.thumb,
    blur: entry.images.blurDataURL,
    w: entry.images.width,
    h: entry.images.height,
    source: entry.source,
    license: entry.attribution?.license,
    domains: entry.domains,
    formats: entry.formats,
    createdAt: entry.createdAt,
  };
}

export function buildSearchItems(entries: PromptEntry[]) {
  return entries.map(mapEntryToSearchItem).toSorted(compareLatestFirst);
}

export function compareLatestFirst(a: { createdAt: string }, b: { createdAt: string }) {
  if (a.createdAt === b.createdAt) return 0;
  return a.createdAt < b.createdAt ? 1 : -1;
}

export function compareTitle(a: SearchItem, b: SearchItem) {
  const left = (a.title ?? a.prompt).toLocaleLowerCase();
  const right = (b.title ?? b.prompt).toLocaleLowerCase();
  return left.localeCompare(right, undefined, { sensitivity: "base" });
}

export function sortSearchItems(items: SearchItem[], sort: SearchSort) {
  if (sort === "title") {
    return items.toSorted(compareTitle);
  }
  return items.toSorted(compareLatestFirst);
}

export function getSourceCounts(items: SearchItem[]) {
  return {
    all: items.length,
    voidlight: items.filter((item) => item.source === "voidlight").length,
    curated: items.filter((item) => item.source !== "voidlight").length,
  };
}

function sortFilterOptions(options: SearchFilterOption[]) {
  return options.toSorted((a, b) => {
    if (a.count === b.count) {
      return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
    }
    return b.count - a.count;
  });
}

export function getSearchCategoryOptions(items: SearchItem[]): SearchFilterOption[] {
  const counts = new Map<string, SearchFilterOption>();

  items.forEach((item) => {
    const current = counts.get(item.category);
    counts.set(item.category, {
      value: item.category,
      label: item.categoryLabel,
      count: (current?.count ?? 0) + 1,
    });
  });

  return sortFilterOptions(Array.from(counts.values()));
}

export function getSearchDomainOptions(items: SearchItem[]): SearchFilterOption[] {
  const counts = new Map<string, SearchFilterOption>();

  items.forEach((item) => {
    item.domains.forEach((domain) => {
      const current = counts.get(domain);
      counts.set(domain, {
        value: domain,
        label: domain,
        count: (current?.count ?? 0) + 1,
      });
    });
  });

  return sortFilterOptions(Array.from(counts.values()));
}

export function getSearchFormatOptions(items: SearchItem[]): SearchFilterOption[] {
  const counts = new Map<string, SearchFilterOption>();

  items.forEach((item) => {
    item.formats.forEach((format) => {
      const current = counts.get(format);
      counts.set(format, {
        value: format,
        label: format.replace("ar-", "").replaceAll("-", ":"),
        count: (current?.count ?? 0) + 1,
      });
    });
  });

  return sortFilterOptions(Array.from(counts.values()));
}

export function filterSearchItems(
  items: SearchItem[],
  filters: {
    source: SourceFilter;
    category: string | null;
    domain: string | null;
    format: string | null;
  }
) {
  return items.filter((item) => {
    if (!matchesSourceFilter(item.source, filters.source)) {
      return false;
    }
    if (filters.category && item.category !== filters.category) {
      return false;
    }
    if (filters.domain && !item.domains.includes(filters.domain)) {
      return false;
    }
    if (filters.format && !item.formats.includes(filters.format)) {
      return false;
    }
    return true;
  });
}
