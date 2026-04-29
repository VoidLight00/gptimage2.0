import promptsKo from "../../content/prompts.json";
import promptsEn from "../../content/prompts.en.json";
import type { ArchiveManifest, CategoryMeta, PromptArgument, PromptEntry, TagMeta } from "./types";

export type Lang = "ko" | "en";
export const LANGS: Lang[] = ["ko", "en"];

type RawPromptArg = {
  name?: string;
  default?: string;
};

type RawNormalizedEntry = {
  id: string;
  source?: string;
  source_url?: string | null;
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
  title?: string | null;
  description?: string | null;
  prompt?: {
    body?: string;
    is_structured?: boolean;
    args?: RawPromptArg[];
    args_upstream?: RawPromptArg[];
  };
  language?: "ko" | "en";
  taxonomy?: {
    section?: string;
    section_label?: string;
    section_label_ko?: string;
    section_label_en?: string;
    purpose?: string[];
    domain?: string[];
    format?: string[];
  };
  tags?: string[];
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
  published_at?: string;
};

type RawManifest = {
  generatedAt: string;
  totalEntries: number;
  skippedCount?: number;
  entries: RawNormalizedEntry[];
};

const rawManifests: Record<Lang, RawManifest> = {
  ko: promptsKo as RawManifest,
  en: promptsEn as RawManifest,
};

const cache: Partial<Record<Lang, ArchiveManifest>> = {};
const PLACEHOLDER_IMAGE = "/brand/voidlight-original.png";
const PLACEHOLDER_WIDTH = 2464;
const PLACEHOLDER_HEIGHT = 2508;

function mapPromptArgument(arg: RawPromptArg, occurrence: number): PromptArgument {
  const name = arg.name ?? "argument";
  const defaultValue = arg.default ?? "";
  return {
    key: `{argument:${name}:${occurrence}}`,
    name,
    defaultValue,
    occurrence,
  };
}

function mapPromptArguments(args: RawPromptArg[] = []) {
  const counts = new Map<string, number>();
  return args.map((arg) => {
    const name = arg.name ?? "argument";
    const occurrence = (counts.get(name) ?? 0) + 1;
    counts.set(name, occurrence);
    return mapPromptArgument(arg, occurrence);
  });
}

function getCategoryLabel(entry: RawNormalizedEntry, lang: Lang) {
  if (lang === "ko") {
    return entry.taxonomy?.section_label_ko ?? entry.taxonomy?.section_label ?? entry.taxonomy?.section ?? "Other";
  }
  return entry.taxonomy?.section_label_en ?? entry.taxonomy?.section_label ?? entry.taxonomy?.section ?? "Other";
}

function getImageVariants(entry: RawNormalizedEntry) {
  const variants = entry.media?.variants ?? {};
  const fullKey = entry.media?.full?.key ?? PLACEHOLDER_IMAGE;
  const thumbKey = entry.media?.thumb?.key ?? variants.w320 ?? fullKey;

  return {
    original: variants.original ?? variants.w1920 ?? fullKey,
    large: variants.large ?? variants.w1920 ?? variants.w1024 ?? fullKey,
    medium: variants.medium ?? variants.w1024 ?? variants.w640 ?? fullKey,
    thumb: variants.thumb ?? variants.w320 ?? thumbKey,
    width: entry.media?.full?.w ?? PLACEHOLDER_WIDTH,
    height: entry.media?.full?.h ?? PLACEHOLDER_HEIGHT,
    blurDataURL: entry.media?.blurDataURL ?? "",
    blurhash: entry.media?.blurhash,
  };
}

function mapNormalizedEntry(entry: RawNormalizedEntry, lang: Lang): PromptEntry {
  const promptBody = entry.prompt?.body ?? "";
  const category = entry.taxonomy?.section ?? "other";
  const images = getImageVariants(entry);

  return {
    id: entry.id,
    source: entry.source ?? "voidlight",
    language: lang,
    title: entry.title ?? null,
    description: entry.description ?? null,
    prompt: promptBody,
    promptBody,
    promptIsStructured: entry.prompt?.is_structured ?? false,
    promptArgs: mapPromptArguments(entry.prompt?.args ?? []),
    promptArgsUpstream: entry.prompt?.args_upstream ?? [],
    category,
    categoryLabel: getCategoryLabel(entry, lang),
    taxonomySection: category,
    taxonomySectionLabel: getCategoryLabel(entry, lang),
    taxonomyPurpose: entry.taxonomy?.purpose ?? [category],
    domains: entry.taxonomy?.domain ?? [],
    formats: entry.taxonomy?.format ?? [],
    tags: entry.tags ?? [],
    sourceUrl: entry.source_url ?? entry.attribution?.source_url,
    attribution: entry.attribution
      ? {
          license: entry.attribution.license ?? "internal",
          licenseUrl: entry.attribution.license_url,
          sourceName: entry.attribution.source_name,
          sourceUrl: entry.attribution.source_url,
          firstPartyUrl: entry.attribution.first_party_url,
          upstreamChain: entry.attribution.upstream_chain ?? [],
          indicationOfChanges: entry.attribution.indication_of_changes,
          rehostedAt: entry.attribution.rehosted_at,
        }
      : undefined,
    images: {
      original: images.original,
      large: images.large,
      medium: images.medium,
      thumb: images.thumb,
      blurDataURL: images.blurDataURL,
      blurhash: images.blurhash,
      width: images.width,
      height: images.height,
    },
    createdAt: entry.published_at ?? new Date(0).toISOString(),
  };
}

function buildCategories(entries: PromptEntry[]) {
  const categories = new Map<string, CategoryMeta>();

  entries.forEach((entry) => {
    const current = categories.get(entry.category);
    categories.set(entry.category, {
      slug: entry.category,
      label: entry.categoryLabel,
      count: (current?.count ?? 0) + 1,
      cover: current?.cover ?? entry.images.thumb,
    });
  });

  return Array.from(categories.values()).sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}

function buildTagMeta(entries: PromptEntry[], kind: "domains" | "formats") {
  const tags = new Map<string, TagMeta>();

  entries.forEach((entry) => {
    const values = kind === "domains" ? entry.domains : entry.formats;
    values.forEach((value) => {
      const current = tags.get(value);
      tags.set(value, {
        slug: value,
        label: kind === "formats" ? value.replace("ar-", "").replaceAll("-", ":") : value,
        count: (current?.count ?? 0) + 1,
      });
    });
  });

  return Array.from(tags.values()).sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}

export function getManifest(lang: Lang): ArchiveManifest {
  if (cache[lang]) {
    return cache[lang]!;
  }

  const rawManifest = rawManifests[lang];
  const entries = rawManifest.entries.map((entry) => mapNormalizedEntry(entry, lang));

  cache[lang] = {
    generatedAt: rawManifest.generatedAt,
    totalEntries: entries.length,
    skippedCount: rawManifest.skippedCount ?? 0,
    categories: buildCategories(entries),
    domains: buildTagMeta(entries, "domains"),
    formats: buildTagMeta(entries, "formats"),
    entries,
  };

  return cache[lang]!;
}

export function getCategories(lang: Lang) {
  return getManifest(lang).categories;
}

export function getEntry(lang: Lang, id: string) {
  return getManifest(lang).entries.find((entry) => entry.id === id);
}

export function getEntriesByCategory(lang: Lang, slug: string) {
  return getManifest(lang).entries.filter((entry) => entry.category === slug);
}

export function getDomains(lang: Lang) {
  return getManifest(lang).domains;
}

export function getFormats(lang: Lang) {
  return getManifest(lang).formats;
}

export function getLatest(lang: Lang, n: number) {
  return [...getManifest(lang).entries]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, n);
}
