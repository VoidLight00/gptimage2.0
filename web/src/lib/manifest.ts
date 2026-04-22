import fs from "node:fs";
import path from "node:path";
import type { ArchiveManifest, PromptEntry, CategoryMeta, TagMeta } from "./types";

export type Lang = "ko" | "en";
export const LANGS: Lang[] = ["ko", "en"];

const EMPTY: ArchiveManifest = {
  generatedAt: new Date(0).toISOString(),
  totalEntries: 0,
  skippedCount: 0,
  categories: [],
  domains: [],
  formats: [],
  entries: [],
};

const cache: Partial<Record<Lang, ArchiveManifest>> = {};

function manifestPath(lang: Lang): string {
  const base = path.join(process.cwd(), "content");
  return lang === "ko"
    ? path.join(base, "prompts.json")
    : path.join(base, "prompts.en.json");
}

export function getManifest(lang: Lang): ArchiveManifest {
  if (cache[lang]) return cache[lang]!;
  const p = manifestPath(lang);
  if (!fs.existsSync(p)) {
    cache[lang] = EMPTY;
    return EMPTY;
  }
  const raw = fs.readFileSync(p, "utf8");
  cache[lang] = JSON.parse(raw) as ArchiveManifest;
  return cache[lang]!;
}

export function getCategories(lang: Lang): CategoryMeta[] {
  return getManifest(lang).categories;
}

export function getEntry(lang: Lang, id: string): PromptEntry | undefined {
  return getManifest(lang).entries.find((e) => e.id === id);
}

export function getEntriesByCategory(lang: Lang, slug: string): PromptEntry[] {
  return getManifest(lang).entries.filter((e) => e.category === slug);
}

export function getDomains(lang: Lang): TagMeta[] {
  return getManifest(lang).domains ?? [];
}

export function getFormats(lang: Lang): TagMeta[] {
  return getManifest(lang).formats ?? [];
}

export function getLatest(lang: Lang, n: number): PromptEntry[] {
  return [...getManifest(lang).entries]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, n);
}
