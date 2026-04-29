import type { MetadataRoute } from "next";
import { getCategories, getManifest } from "@/lib/manifest";
import { absoluteUrl } from "@/lib/site";

function getLastModified() {
  const generatedAt = [getManifest("ko").generatedAt, getManifest("en").generatedAt].sort().at(-1);
  return generatedAt ?? new Date().toISOString();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = getLastModified();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/about"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/license"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/ko"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/en"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/ko/search"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/en/search"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/ko/c"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/en/c"),
      lastModified,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  const categoryRoutes = (["ko", "en"] as const).flatMap((lang) =>
    getCategories(lang).map((category) => ({
      url: absoluteUrl(`/${lang}/c/${category.slug}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  );

  const promptRoutes = (["ko", "en"] as const).flatMap((lang) =>
    getManifest(lang).entries.map((entry) => ({
      url: absoluteUrl(`/${lang}/p/${entry.id}`),
      lastModified: entry.createdAt || lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.5,
      images: entry.images.large ? [absoluteUrl(entry.images.large)] : undefined,
    }))
  );

  return [...staticRoutes, ...categoryRoutes, ...promptRoutes];
}
