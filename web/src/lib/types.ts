export type PromptArgument = {
  key: string;
  name: string;
  defaultValue: string;
  occurrence: number;
};

export type AttributionData = {
  license: string;
  licenseUrl?: string;
  sourceName?: string;
  sourceUrl?: string;
  firstPartyUrl?: string;
  upstreamChain: string[];
  indicationOfChanges?: string;
  rehostedAt?: string;
};

export type PromptEntry = {
  id: string;
  source: "voidlight" | "prompts3" | string;
  language: "ko" | "en";
  title?: string | null;
  description?: string | null;
  prompt: string;
  promptBody: string;
  promptIsStructured: boolean;
  promptArgs: PromptArgument[];
  promptArgsUpstream: Array<{ name?: string; default?: string }>;
  category: string;
  categoryLabel: string;
  taxonomySection: string;
  taxonomySectionLabel: string;
  taxonomyPurpose: string[];
  domains: string[];
  formats: string[];
  tags: string[];
  model?: string;
  sourceFolder?: string;
  sourceUrl?: string;
  imageSourceUrl?: string;
  attribution?: AttributionData;
  images: {
    original: string;
    large: string;
    medium: string;
    thumb: string;
    blurDataURL: string;
    blurhash?: string;
    width: number;
    height: number;
  };
  createdAt: string;
};

export type CategoryMeta = {
  slug: string;
  label: string;
  description?: string;
  count: number;
  cover?: string;
};

export type TagMeta = {
  slug: string;
  label: string;
  count: number;
};

export type ArchiveManifest = {
  generatedAt: string;
  totalEntries: number;
  skippedCount: number;
  categories: CategoryMeta[];
  domains: TagMeta[];
  formats: TagMeta[];
  entries: PromptEntry[];
};
