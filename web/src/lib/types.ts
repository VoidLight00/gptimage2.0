export type PromptEntry = {
  id: string;
  language?: "ko" | "en";
  title?: string;
  prompt: string;
  negativePrompt?: string;
  category: string;
  categoryLabel: string;
  domains: string[];
  formats: string[];
  tags: string[];
  model?: string;
  sourceFolder?: string;
  sourceUrl?: string;       // EN entries: 원본 X/Twitter·블로그 링크
  imageSourceUrl?: string;  // EN entries: 원격 이미지 원본 URL
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
