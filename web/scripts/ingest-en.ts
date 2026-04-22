/**
 * awesome-gpt-image README를 파싱해 EN 섹션용 엔트리를 생성.
 *
 * 각 `### 제목` 블록 → 이미지 + 프롬프트 + 소스 + 상위 `## 섹션`(카테고리)
 * 이미지는 원격 URL이면 HTTP 다운로드, 로컬 assets/… 이면 복사.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_ROOT = path.resolve(__dirname, "..");
const ROOT = path.resolve(WEB_ROOT, "..");
const SRC_REPO = path.join(ROOT, "external", "awesome-gpt-image");
const README = path.join(SRC_REPO, "README.md");
const OUT_IMG = path.join(WEB_ROOT, "public", "images-en");
const OUT_JSON = path.join(WEB_ROOT, "content", "prompts.en.json");

/* ─── 섹션 → 카테고리 slug 매핑 ────────────────────────────────────────── */
const SECTION_MAP: Record<string, { slug: string; label: string }> = {
  "Photography & Photorealism": { slug: "photography", label: "Photography & Photorealism" },
  "Game & Entertainment": { slug: "game", label: "Game & Entertainment" },
  "UI/UX & Social Media": { slug: "uiux", label: "UI/UX & Social Media" },
  "Video, Animation & Collage": { slug: "video", label: "Video & Animation" },
  "Typography & Poster Design": { slug: "typography", label: "Typography & Poster" },
  "Infographics, Education & Documents": {
    slug: "infographics",
    label: "Infographics & Education",
  },
  "Character & Consistency": { slug: "character", label: "Character & Consistency" },
  "Image Editing & Style Transfer": { slug: "editing", label: "Image Editing" },
};

/* ─── 유틸 ────────────────────────────────────────────────────────────── */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

async function downloadOrCopy(url: string, destBase: string): Promise<string | null> {
  // 로컬 assets 경로
  if (!url.startsWith("http")) {
    const src = path.join(SRC_REPO, url);
    if (!fs.existsSync(src)) return null;
    const ext = path.extname(src) || ".jpg";
    const dest = destBase + ext;
    fs.copyFileSync(src, dest);
    return dest;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // 확장자 추출
    const ext = (() => {
      const m = url.match(/\.(jpg|jpeg|png|webp|gif)(?:\?|$)/i);
      if (m) return "." + m[1].toLowerCase();
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("png")) return ".png";
      if (ct.includes("webp")) return ".webp";
      if (ct.includes("gif")) return ".gif";
      return ".jpg";
    })();
    const dest = destBase + ext;
    fs.writeFileSync(dest, buf);
    return dest;
  } catch {
    return null;
  }
}

async function processToWebp(src: string, id: string) {
  ensureDir(path.join(OUT_IMG, "original"));
  ensureDir(path.join(OUT_IMG, "large"));
  ensureDir(path.join(OUT_IMG, "medium"));
  ensureDir(path.join(OUT_IMG, "thumb"));

  try {
    const image = sharp(src);
    const meta = await image.metadata();
    const width = meta.width ?? 1024;
    const height = meta.height ?? 1024;

    await sharp(src).webp({ quality: 90 }).toFile(path.join(OUT_IMG, "original", `${id}.webp`));
    await sharp(src)
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(OUT_IMG, "large", `${id}.webp`));
    await sharp(src)
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(OUT_IMG, "medium", `${id}.webp`));
    await sharp(src)
      .resize(400, 400, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(path.join(OUT_IMG, "thumb", `${id}.webp`));
    const blurBuf = await sharp(src)
      .resize(16, 16, { fit: "inside" })
      .webp({ quality: 40 })
      .toBuffer();
    return {
      original: `/images-en/original/${id}.webp`,
      large: `/images-en/large/${id}.webp`,
      medium: `/images-en/medium/${id}.webp`,
      thumb: `/images-en/thumb/${id}.webp`,
      blurDataURL: `data:image/webp;base64,${blurBuf.toString("base64")}`,
      width,
      height,
    };
  } catch {
    return null;
  }
}

/* ─── 파서 ────────────────────────────────────────────────────────────── */
type RawEntry = {
  id: string;
  title: string;
  sectionName: string;
  sectionLabel: string;
  sectionSlug: string;
  imageUrls: string[];
  prompt: string;
  sourceUrl?: string;
};

function parseReadme(md: string): RawEntry[] {
  const entries: RawEntry[] = [];
  const lines = md.split("\n");

  let currentSection: { name: string; slug: string; label: string } | null = null;
  let idx = 0;

  while (idx < lines.length) {
    const line = lines[idx];
    // 섹션 헤더
    const secMatch = line.match(/^##\s+(.+)$/);
    if (secMatch) {
      const clean = secMatch[1]
        .replace(/[📷🎮📱🎬📰📚🎭🖼️📊🤝]/g, "")
        .trim();
      const mapped = SECTION_MAP[clean];
      currentSection = mapped ? { name: clean, slug: mapped.slug, label: mapped.label } : null;
      idx++;
      continue;
    }

    // 엔트리 헤더
    const entryMatch = line.match(/^###\s+(.+)$/);
    if (entryMatch && currentSection) {
      const title = entryMatch[1].trim();
      const id = `en-${currentSection.slug}-${slugify(title)}`;
      const imageUrls: string[] = [];
      let prompt = "";
      let sourceUrl: string | undefined;

      // 다음 ### 또는 ## 나올 때까지 수집
      let j = idx + 1;
      while (j < lines.length) {
        const l = lines[j];
        if (/^##\s/.test(l) || /^###\s/.test(l)) break;

        // 이미지: <img ... src="URL" ...>
        const imgTag = l.match(/<img[^>]+src="([^"]+)"/);
        if (imgTag) imageUrls.push(imgTag[1]);
        // 이미지: ![alt](url)
        const imgMd = l.match(/!\[[^\]]*\]\(([^)]+)\)/);
        if (imgMd) imageUrls.push(imgMd[1]);

        // 프롬프트 코드 블록
        if (/^\s*```/.test(l) && !prompt) {
          const start = j + 1;
          let end = start;
          while (end < lines.length && !/^\s*```/.test(lines[end])) end++;
          prompt = lines.slice(start, end).join("\n").trim();
          j = end + 1;
          continue;
        }

        // Source
        const src = l.match(/\*\*Source:?\*\*\s*\[[^\]]+\]\(([^)]+)\)/i);
        if (src && !sourceUrl) sourceUrl = src[1];

        j++;
      }

      if (prompt && imageUrls.length > 0) {
        entries.push({
          id,
          title,
          sectionName: currentSection.name,
          sectionLabel: currentSection.label,
          sectionSlug: currentSection.slug,
          imageUrls,
          prompt,
          sourceUrl,
        });
      }
      idx = j;
      continue;
    }
    idx++;
  }
  return entries;
}

/* ─── 태그 추출 (영어 전용) ────────────────────────────────────────────── */
const STOP_EN = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "into",
  "over",
  "very",
  "high",
  "image",
  "photo",
  "photograph",
  "create",
  "scene",
  "look",
  "design",
  "shot",
  "background",
  "style",
  "their",
  "they",
  "have",
  "there",
  "some",
  "were",
  "when",
  "been",
  "should",
  "which",
  "about",
  "like",
  "just",
  "only",
  "also",
  "what",
  "your",
  "more",
  "than",
  "into",
  "while",
]);

function extractTagsEn(prompt: string): string[] {
  const freq: Record<string, number> = {};
  const words = prompt.toLowerCase().match(/[a-z][a-z-]{2,20}/g) || [];
  for (const w of words) if (!STOP_EN.has(w)) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w);
}

/* ─── 포맷 태그 (AR 감지) ──────────────────────────────────────────────── */
function formatTags(width: number, height: number): string[] {
  const r = width / height;
  const tags: string[] = [];
  if (Math.abs(r - 1) < 0.03) tags.push("ar-1-1");
  else if (Math.abs(r - 0.5625) < 0.05) tags.push("ar-9-16");
  else if (Math.abs(r - 0.8) < 0.04) tags.push("ar-4-5");
  else if (Math.abs(r - 0.75) < 0.04) tags.push("ar-3-4");
  else if (Math.abs(r - 1.778) < 0.08) tags.push("ar-16-9");
  else if (Math.abs(r - 1.5) < 0.05) tags.push("ar-3-2");
  else if (Math.abs(r - 2.333) < 0.1) tags.push("ar-21-9");
  return tags;
}

/* ─── Main ────────────────────────────────────────────────────────────── */
async function main() {
  const md = fs.readFileSync(README, "utf8");
  const raw = parseReadme(md);
  console.log(`Parsed ${raw.length} entries from awesome-gpt-image`);

  ensureDir(path.dirname(OUT_JSON));
  ensureDir(OUT_IMG);
  const tmpDir = path.join(OUT_IMG, "_tmp");
  ensureDir(tmpDir);

  const entries: unknown[] = [];
  const categoryCounts: Record<string, { label: string; count: number; cover?: string }> = {};
  const formatCounts: Record<string, number> = {};
  const failed: string[] = [];

  let i = 0;
  for (const e of raw) {
    i++;
    // 첫 번째 사용 가능한 이미지 사용
    let processed = null;
    let usedUrl = "";
    for (const url of e.imageUrls) {
      const tmp = path.join(tmpDir, `${e.id}`);
      const downloaded = await downloadOrCopy(url, tmp);
      if (downloaded) {
        processed = await processToWebp(downloaded, e.id);
        try {
          fs.unlinkSync(downloaded);
        } catch {}
        if (processed) {
          usedUrl = url;
          break;
        }
      }
    }
    if (!processed) {
      failed.push(e.id);
      console.log(`  ✗ ${e.id} — 이미지 처리 실패`);
      continue;
    }
    const formats = formatTags(processed.width, processed.height);
    for (const f of formats) formatCounts[f] = (formatCounts[f] || 0) + 1;
    if (!categoryCounts[e.sectionSlug]) {
      categoryCounts[e.sectionSlug] = {
        label: e.sectionLabel,
        count: 0,
        cover: processed.thumb,
      };
    }
    categoryCounts[e.sectionSlug].count++;

    entries.push({
      id: e.id,
      language: "en",
      title: e.title,
      prompt: e.prompt,
      category: e.sectionSlug,
      categoryLabel: e.sectionLabel,
      domains: [],
      formats,
      tags: extractTagsEn(e.prompt),
      sourceUrl: e.sourceUrl,
      imageSourceUrl: usedUrl,
      images: processed,
      createdAt: new Date().toISOString(),
    });
    if (i % 10 === 0 || i === raw.length) console.log(`  ... ${i}/${raw.length}`);
  }

  // tmp 정리
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {}

  const categories = Object.entries(categoryCounts)
    .map(([slug, v]) => ({ slug, label: v.label, count: v.count, cover: v.cover }))
    .sort((a, b) => b.count - a.count);

  const formats = Object.entries(formatCounts)
    .map(([slug, count]) => ({
      slug,
      label: slug.replace("ar-", "").replace("-", ":"),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify(
      {
        language: "en",
        generatedAt: new Date().toISOString(),
        totalEntries: entries.length,
        skippedCount: failed.length,
        categories,
        domains: [],
        formats,
        entries,
      },
      null,
      2
    )
  );

  console.log(`\n▸ Done`);
  console.log(`  entries:    ${entries.length}`);
  console.log(`  categories: ${categories.length}`);
  console.log(`  failed:     ${failed.length}`);
  console.log(`  output:     content/prompts.en.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
