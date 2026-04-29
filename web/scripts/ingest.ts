import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_ROOT = path.resolve(__dirname, "..");
const PROJECT_ROOT = path.resolve(WEB_ROOT, "..");
const CONTENT_DIR = path.join(WEB_ROOT, "content");
const ARTIFACTS_DIR = path.join(PROJECT_ROOT, "_workspace", "p3-merge", "artifacts");
const RAG_DIR = path.join(PROJECT_ROOT, "_workspace", "rag");

const PLACEHOLDER_IMAGE = "/brand/voidlight-original.png";
const PLACEHOLDER_WIDTH = 2464;
const PLACEHOLDER_HEIGHT = 2508;

const SOURCE_FILES = {
  ko: "prompts.ko.json",
  en: "prompts.en.json",
  master: "prompts.master.json",
} as const;

type Lang = "ko" | "en";

type RawEntry = {
  id: string;
  source?: string;
  language?: Lang;
  title?: string | null;
  tags?: string[];
  published_at?: string;
  prompt?: {
    body?: string;
  };
  taxonomy?: {
    section?: string;
    section_label?: string;
    section_label_ko?: string;
    section_label_en?: string;
    domain?: string[];
    format?: string[];
  };
  attribution?: {
    license?: string;
  };
  media?: {
    full?: { key?: string; w?: number; h?: number };
    thumb?: { key?: string };
    blurDataURL?: string;
    variants?: {
      thumb?: string;
      w320?: string;
      original?: string;
    };
  };
};

type RawManifest = {
  generatedAt: string;
  totalEntries: number;
  skippedCount: number;
  entries: RawEntry[];
};

type SearchItem = {
  id: string;
  language: Lang;
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

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function getArtifactPath(fileName: string) {
  return path.join(ARTIFACTS_DIR, fileName);
}

function getContentPath(fileName: string) {
  return path.join(CONTENT_DIR, fileName);
}

function readManifest(fileName: string) {
  return readJsonFile<RawManifest>(getArtifactPath(fileName));
}

function copyManifest(sourceFile: string, targetFile: string) {
  fs.copyFileSync(getArtifactPath(sourceFile), getContentPath(targetFile));
}

function resolveCategoryLabel(entry: RawEntry, lang: Lang) {
  if (lang === "ko") {
    return entry.taxonomy?.section_label_ko ?? entry.taxonomy?.section_label ?? entry.taxonomy?.section ?? "Other";
  }
  return entry.taxonomy?.section_label_en ?? entry.taxonomy?.section_label ?? entry.taxonomy?.section ?? "Other";
}

function resolveThumb(entry: RawEntry) {
  return (
    entry.media?.thumb?.key ??
    entry.media?.variants?.thumb ??
    entry.media?.variants?.w320 ??
    entry.media?.full?.key ??
    entry.media?.variants?.original ??
    PLACEHOLDER_IMAGE
  );
}

function toSearchItems(manifest: RawManifest, lang: Lang) {
  return manifest.entries.map<SearchItem>((entry) => ({
    id: entry.id,
    language: lang,
    title: entry.title ?? null,
    prompt: entry.prompt?.body ?? "",
    category: entry.taxonomy?.section ?? "other",
    categoryLabel: resolveCategoryLabel(entry, lang),
    tags: entry.tags ?? [],
    model: "",
    thumb: resolveThumb(entry),
    blur: entry.media?.blurDataURL,
    w: entry.media?.full?.w ?? PLACEHOLDER_WIDTH,
    h: entry.media?.full?.h ?? PLACEHOLDER_HEIGHT,
    source: entry.source ?? "voidlight",
    license: entry.attribution?.license,
    domains: entry.taxonomy?.domain ?? [],
    formats: entry.taxonomy?.format ?? [],
    createdAt: entry.published_at ?? new Date(0).toISOString(),
  }));
}

function resolveRunId() {
  const latestPath = path.join(RAG_DIR, "latest.json");
  if (fs.existsSync(latestPath)) {
    const latest = readJsonFile<{ run_id?: string }>(latestPath);
    if (latest.run_id) {
      return latest.run_id;
    }
  }

  const metaPath = getContentPath("rag.meta.json");
  if (fs.existsSync(metaPath)) {
    const meta = readJsonFile<{ run_id?: string }>(metaPath);
    if (meta.run_id) {
      return meta.run_id;
    }
  }

  return "p3-merge";
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function main() {
  const koManifest = readManifest(SOURCE_FILES.ko);
  const enManifest = readManifest(SOURCE_FILES.en);
  const masterManifest = readManifest(SOURCE_FILES.master);

  const splitTotal = koManifest.totalEntries + enManifest.totalEntries;
  if (splitTotal !== masterManifest.totalEntries) {
    throw new Error(`split totals do not match master total: ${splitTotal} !== ${masterManifest.totalEntries}`);
  }

  copyManifest(SOURCE_FILES.ko, "prompts.json");
  copyManifest(SOURCE_FILES.en, "prompts.en.json");
  copyManifest(SOURCE_FILES.master, "prompts.merged.json");

  const searchItems = [...toSearchItems(koManifest, "ko"), ...toSearchItems(enManifest, "en")].toSorted((a, b) => {
    if (a.createdAt === b.createdAt) {
      return 0;
    }
    return a.createdAt < b.createdAt ? 1 : -1;
  });

  writeJson(getContentPath("rag.search.json"), searchItems);
  writeJson(getContentPath("rag.meta.json"), {
    run_id: resolveRunId(),
    generatedAt: masterManifest.generatedAt,
    indexReady: false,
    mode: "fallback",
    blockedReason: "Embedding index not active; using split manifest fallback corpus.",
    entryCount: searchItems.length,
    koEntryCount: koManifest.totalEntries,
    enEntryCount: enManifest.totalEntries,
    dimensions: null,
    binary: null,
  });

  fs.writeFileSync(getContentPath("skipped.log"), "");

  console.log(`synced prompts.json: ${koManifest.totalEntries}`);
  console.log(`synced prompts.en.json: ${enManifest.totalEntries}`);
  console.log(`synced prompts.merged.json: ${masterManifest.totalEntries}`);
  console.log(`generated rag.search.json: ${searchItems.length}`);
}

main();
