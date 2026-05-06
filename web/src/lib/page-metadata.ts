import type { Metadata } from "next";
import type { CategoryMeta, PromptEntry } from "./types";
import { SITE_NAME, absoluteUrl, getSiteUrl } from "./site";

export type SiteLang = "ko" | "en";

function summarizeText(value: string, maxLength: number) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) {
    return compact;
  }
  return `${compact.slice(0, maxLength - 1).trimEnd()}…`;
}

function sectionName(lang: SiteLang) {
  return lang.toUpperCase();
}

export function resolveLangFromPath(pathname: string): SiteLang {
  return pathname.startsWith("/en") ? "en" : "ko";
}

const ROOT_DESCRIPTIONS: Record<SiteLang, { long: string; short: string }> = {
  ko: {
    long: "VOIDLIGHT가 큐레이팅한 GPT 이미지 프롬프트와 결과물, 출처 정보를 한자리에 모은 아카이브.",
    short: "VOIDLIGHT가 큐레이팅한 GPT 이미지 프롬프트 아카이브.",
  },
  en: {
    long: "A curated archive of GPT image prompts paired with generated results and attribution by VOIDLIGHT.",
    short: "A curated archive of GPT image prompts by VOIDLIGHT.",
  },
};

export function buildRootMetadata(lang: SiteLang = "ko"): Metadata {
  const copy = ROOT_DESCRIPTIONS[lang];
  return {
    metadataBase: new URL(getSiteUrl()),
    title: `${SITE_NAME} — PROMPT ARCHIVE`,
    description: copy.long,
    openGraph: {
      title: SITE_NAME,
      description: copy.short,
      type: "website",
      url: absoluteUrl("/"),
      locale: lang === "ko" ? "ko_KR" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: copy.short,
    },
  };
}

export function buildCategoryMetadata(lang: SiteLang, category: CategoryMeta): Metadata {
  const section = sectionName(lang);
  const description =
    lang === "ko"
      ? `${category.label} 카테고리의 프롬프트 ${category.count}개를 탐색합니다.`
      : `Browse ${category.count} prompts in the ${category.label} category.`;

  return {
    title: `${category.label} · ${section} — ${SITE_NAME}`,
    description,
    alternates: {
      canonical: absoluteUrl(`/${lang}/c/${category.slug}`),
    },
    openGraph: {
      title: `${category.label} · ${section}`,
      description,
      url: absoluteUrl(`/${lang}/c/${category.slug}`),
      type: "website",
      images: category.cover ? [{ url: absoluteUrl(category.cover) }] : undefined,
    },
  };
}

export function buildPromptMetadata(lang: SiteLang, entry: PromptEntry): Metadata {
  const section = sectionName(lang);
  const title = entry.title ?? summarizeText(entry.prompt, 80);
  const description = summarizeText(entry.description ?? entry.prompt, 160);
  const path = `/${lang}/p/${entry.id}`;

  return {
    title: `${title} · ${section} — ${SITE_NAME}`,
    description,
    alternates: {
      canonical: absoluteUrl(path),
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      type: "article",
      images: entry.images.large ? [{ url: absoluteUrl(entry.images.large) }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: entry.images.large ? [absoluteUrl(entry.images.large)] : undefined,
    },
  };
}
