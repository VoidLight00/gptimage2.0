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

const CURATED_KO_FILE = "curated.ko.json";

type Lang = "ko" | "en";

type RawEntry = {
  id: string;
  source?: string;
  source_url?: string | null;
  language?: Lang;
  title?: string | null;
  description?: string | null;
  tags?: string[];
  published_at?: string;
  prompt?: {
    body?: string;
    is_structured?: boolean;
    args?: Array<{ name?: string; default?: string }>;
    args_upstream?: Array<{ name?: string; default?: string }>;
  };
  taxonomy?: {
    section?: string;
    section_label?: string;
    section_label_ko?: string;
    section_label_en?: string;
    purpose?: string[];
    domain?: string[];
    format?: string[];
    upstream_categories?: string[];
  };
  attribution?: {
    license?: string;
    license_url?: string;
    source_name?: string;
    source_url?: string;
    first_party_url?: string;
    upstream_chain?: string[];
    indication_of_changes?: string;
    rehosted_at?: string;
  };
  media?: {
    full?: { key?: string; w?: number; h?: number };
    thumb?: { key?: string };
    blurDataURL?: string;
    blurhash?: string;
    variants?: {
      large?: string;
      medium?: string;
      thumb?: string;
      original?: string;
      w320?: string;
      w640?: string;
      w1024?: string;
      w1920?: string;
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

function readContentManifest(fileName: string) {
  return readJsonFile<RawManifest>(getContentPath(fileName));
}

function readCuratedKoEntries() {
  const curatedPath = getContentPath(CURATED_KO_FILE);
  if (!fs.existsSync(curatedPath)) {
    return [];
  }

  return readJsonFile<RawManifest>(curatedPath).entries;
}

function withoutRemovedOursEntries(manifest: RawManifest): RawManifest {
  const entries = manifest.entries.filter((entry) => !entry.id.startsWith("ours-"));
  return {
    ...manifest,
    totalEntries: entries.length,
    entries,
  };
}

function withPrependedEntries(manifest: RawManifest, entriesToPrepend: RawEntry[]): RawManifest {
  if (entriesToPrepend.length === 0) {
    return manifest;
  }

  const prependIds = new Set(entriesToPrepend.map((entry) => entry.id));
  const entries = [...entriesToPrepend, ...manifest.entries.filter((entry) => !prependIds.has(entry.id))];
  return {
    ...manifest,
    generatedAt: entriesToPrepend[0]?.published_at ?? manifest.generatedAt,
    totalEntries: entries.length,
    entries,
  };
}

function assertUniqueEntryIds(label: string, entries: RawEntry[]) {
  const seenIds = new Set<string>();
  const duplicateIds = new Set<string>();

  entries.forEach((entry) => {
    if (seenIds.has(entry.id)) {
      duplicateIds.add(entry.id);
      return;
    }
    seenIds.add(entry.id);
  });

  if (duplicateIds.size > 0) {
    throw new Error(`${label} contains duplicate ids: ${Array.from(duplicateIds).join(", ")}`);
  }
}

function assertDisjointEntryIds(leftLabel: string, leftEntries: RawEntry[], rightLabel: string, rightEntries: RawEntry[]) {
  const leftIds = new Set(leftEntries.map((entry) => entry.id));
  const overlappingIds = new Set(rightEntries.filter((entry) => leftIds.has(entry.id)).map((entry) => entry.id));

  if (overlappingIds.size > 0) {
    throw new Error(`${leftLabel} and ${rightLabel} contain overlapping ids: ${Array.from(overlappingIds).join(", ")}`);
  }
}

function buildMergedManifest(koManifest: RawManifest, enManifest: RawManifest): RawManifest {
  assertUniqueEntryIds("ko manifest", koManifest.entries);
  assertUniqueEntryIds("en manifest", enManifest.entries);
  assertDisjointEntryIds("ko manifest", koManifest.entries, "en manifest", enManifest.entries);

  const entries = [...koManifest.entries, ...enManifest.entries];
  return {
    generatedAt: koManifest.generatedAt,
    totalEntries: entries.length,
    skippedCount: koManifest.skippedCount + enManifest.skippedCount,
    entries,
  };
}

function writeManifest(targetFile: string, manifest: RawManifest) {
  writeCompactJson(getContentPath(targetFile), manifest);
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
    entry.media?.variants?.w1920 ??
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

function writeCompactJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(value)}\n`);
}

function main() {
  const curatedKoEntries = readCuratedKoEntries();
  const koManifest = withPrependedEntries(withoutRemovedOursEntries(readManifest(SOURCE_FILES.ko)), curatedKoEntries);
  const enManifest = readContentManifest("prompts.en.json");
  const masterManifest = buildMergedManifest(koManifest, enManifest);

  writeManifest("prompts.json", koManifest);
  writeManifest("prompts.merged.json", masterManifest);

  const searchItems = [...toSearchItems(koManifest, "ko"), ...toSearchItems(enManifest, "en")].toSorted((a, b) => {
    if (a.createdAt === b.createdAt) {
      return 0;
    }
    return a.createdAt < b.createdAt ? 1 : -1;
  });

  writeCompactJson(getContentPath("rag.search.json"), searchItems);
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
  console.log(`using prompts.en.json: ${enManifest.totalEntries}`);
  console.log(`synced prompts.merged.json: ${masterManifest.totalEntries}`);
  console.log(`generated rag.search.json: ${searchItems.length}`);
}

main();
