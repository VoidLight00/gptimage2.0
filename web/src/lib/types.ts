export type PromptEntry = {
  id: string;
  prompt: string;
  negativePrompt?: string;
  category: string;
  categoryLabel: string;
  tags: string[];
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

export type ArchiveManifest = {
  generatedAt: string;
  totalEntries: number;
  skippedCount: number;
  categories: CategoryMeta[];
  entries: PromptEntry[];
};
