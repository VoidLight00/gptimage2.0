import type { MetadataRoute } from "next";
import { getManifest } from "@/lib/manifest";
import { absoluteUrl } from "@/lib/site";

function getLastModified() {
  const generatedAt = [getManifest("ko").generatedAt, getManifest("en").generatedAt].sort().at(-1);
  return generatedAt ?? new Date().toISOString();
}

// Private archive: sitemap exposes only the public-facing pages.
// Gated content (/ko, /en, categories, prompt detail) is intentionally omitted
// so search engines never get a URL inventory of the password-protected archive.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = getLastModified();
  return [
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
  ];
}
