import fs from "node:fs";
import path from "node:path";
import type { ArchiveManifest, PromptEntry, CategoryMeta } from "./types";

const EMPTY_MANIFEST: ArchiveManifest = {
  generatedAt: new Date(0).toISOString(),
  totalEntries: 0,
  skippedCount: 0,
  categories: [],
  entries: [],
};

let cached: ArchiveManifest | null = null;

export function getManifest(): ArchiveManifest {
  if (cached) return cached;
  const filePath = path.join(process.cwd(), "content", "prompts.json");
  if (!fs.existsSync(filePath)) {
    cached = EMPTY_MANIFEST;
    return cached;
  }
  const raw = fs.readFileSync(filePath, "utf8");
  cached = JSON.parse(raw) as ArchiveManifest;
  return cached;
}

export function getCategories(): CategoryMeta[] {
  return getManifest().categories;
}

export function getEntry(id: string): PromptEntry | undefined {
  return getManifest().entries.find((e) => e.id === id);
}

export function getEntriesByCategory(slug: string): PromptEntry[] {
  return getManifest().entries.filter((e) => e.category === slug);
}

export function getLatest(n: number): PromptEntry[] {
  return [...getManifest().entries]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, n);
}
