import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  // Private archive: only the public-facing pages (gate landing, about, license)
  // are indexable. Everything else is behind the password gate.
  return {
    rules: {
      userAgent: "*",
      allow: ["/about", "/license", "/gate"],
      disallow: ["/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
