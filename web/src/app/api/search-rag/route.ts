import type { NextRequest } from "next/server";
import { buildSearchItems, type SearchItem } from "@/lib/archive-search";
import { getManifest, LANGS, type Lang } from "@/lib/manifest";

export const runtime = "nodejs";

type CorpusItem = SearchItem;

let corpusCache: CorpusItem[] | undefined;

function normalizeLang(value: string | null): Lang | null {
  return value === "ko" || value === "en" ? value : null;
}

function normalizeSource(value: string | null): string | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v === "voidlight" || v === "prompts3" || v === "youmind" || v === "all") {
    return v === "all" ? null : v;
  }
  return null;
}

function getCorpus(lang: Lang | null) {
  if (lang) {
    return buildSearchItems(getManifest(lang).entries);
  }

  if (corpusCache) return corpusCache;

  corpusCache = LANGS.flatMap((currentLang) =>
    buildSearchItems(getManifest(currentLang).entries),
  ).toSorted((a, b) => {
    if (a.createdAt === b.createdAt) return 0;
    return a.createdAt < b.createdAt ? 1 : -1;
  });

  return corpusCache;
}

const TOKEN_SPLIT = /[\s　.,;:!?'"()\[\]{}\-_/\\·—–]+/;

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(TOKEN_SPLIT)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function score(item: CorpusItem, queryLc: string, queryTokens: string[]): number {
  if (!queryLc) return 0;

  const titleLc = (item.title ?? "").toLowerCase();
  const promptLc = item.prompt.slice(0, 800).toLowerCase();
  const catLc = item.categoryLabel.toLowerCase();
  const slugLc = item.category.toLowerCase();
  const tagsLc = item.tags.join(" ").toLowerCase();
  const haystack = `${titleLc}\n${promptLc}\n${catLc}\n${tagsLc}`;

  let s = 0;
  if (haystack.includes(queryLc)) s += 6;
  if (titleLc.includes(queryLc)) s += 4;
  if (titleLc.startsWith(queryLc)) s += 2;
  if (catLc.includes(queryLc) || slugLc.includes(queryLc)) s += 3;

  const hTokens = new Set(tokenize(haystack));
  for (const t of queryTokens) if (hTokens.has(t)) s += 1.5;

  return s;
}

function clampInt(value: string | null, def: number, min: number, max: number) {
  const n = Number.parseInt(value ?? "", 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const query = params.get("q")?.trim() ?? "";
    const lang = normalizeLang(params.get("lang"));
    const source = normalizeSource(params.get("source"));
    const category = params.get("category")?.trim() ?? "";
    const limit = clampInt(params.get("limit"), 24, 1, 100);
    const offset = clampInt(params.get("offset"), 0, 0, 5000);

    const corpus = getCorpus(lang);

    const filtered = corpus.filter(
      (item) =>
        (!source || item.source === source) &&
        (!category || item.category === category),
    );

    const queryLc = query.toLowerCase();
    const queryTokens = tokenize(query);

    let scored = filtered.map((item) => ({
      item,
      score: query ? score(item, queryLc, queryTokens) : 1,
    }));

    if (query) scored = scored.filter((row) => row.score > 0);
    if (query) scored.sort((a, b) => b.score - a.score);

    const total = scored.length;
    const page = scored.slice(offset, offset + limit);

    return Response.json(
      {
        success: true,
        data: page.map((row) => row.item),
        meta: {
          total,
          offset,
          limit,
          query,
          lang: lang ?? "all",
          source: source ?? "all",
          category: category || "all",
          indexReady: false,
          mode: "fallback",
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return Response.json(
      { success: false, error: "Failed to build fallback search results." },
      { status: 500 },
    );
  }
}
