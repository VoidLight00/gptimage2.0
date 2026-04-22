export type PromptEntry = {
  id: string;
  prompt: string;
  negativePrompt?: string;
  category: string;          // primary — Purpose slug
  categoryLabel: string;
  domains: string[];         // Domain slugs (Beauty, Hospitality, …)
  formats: string[];         // Format slugs (ar-4-5, ar-9-16, …)
  tags: string[];            // extracted keyword tags
  model?: string;
  sourceFolder?: string;
  images: {
    original: string;
    large: string;
    medium: string;
    thumb: string;
    blurDataURL: string;
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
