const DEFAULT_SITE_URL = "https://gptimage2-0.vercel.app";

export const SITE_NAME = "GPTIMAGE 2.0";

export function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const siteUrl = envUrl && envUrl.length > 0 ? envUrl : DEFAULT_SITE_URL;
  return siteUrl.replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
