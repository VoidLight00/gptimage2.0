/**
 * Ingest pipeline: raw/ 폴더의 이미지 + xlsx 시트 →
 *   content/prompts.json + skipped.log + public/images/{thumb,medium,large}/
 *
 * 실행:  npm run ingest
 *
 * 규칙:
 *  - 프롬프트 없는 이미지는 스킵 (skipped.log에 이유 기록)
 *  - xlsx의 시트별로 "이미지 ID 컬럼"과 "프롬프트 컬럼"을 자동 감지
 *  - 카테고리 overrides.json 이 있으면 id→category 매핑 우선 적용
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import * as XLSX from "xlsx";
import { classify, extractTags, DOMAINS, FORMATS } from "./categorize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_ROOT = path.resolve(__dirname, "..");
const ROOT = path.resolve(WEB_ROOT, "..");
const RAW_DIR = path.join(ROOT, "raw");
const CONTENT_DIR = path.join(WEB_ROOT, "content");
const PUBLIC_IMAGES = path.join(WEB_ROOT, "public", "images");
const OVERRIDES_PATH = path.join(CONTENT_DIR, "overrides.json");
const BATCH_MANIFEST = path.join(ROOT, "batch", "manifest.jsonl");

type OverrideMap = Record<string, { category?: string; prompt?: string; tags?: string[] }>;

const SIZES = {
  thumb: 400,
  medium: 800,
  large: 1600,
} as const;

type ExtractedRow = {
  id: string;
  prompt: string;
  model?: string;
  negativePrompt?: string;
  source: { file: string; sheet?: string; row?: number };
  /** batch manifest 에서 강제 지정된 카테고리 (존재 시 classify 우회) */
  forcedCategory?: { slug: string; label: string };
};

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log(...args);
}

/* ---------------------------------- Walk ---------------------------------- */

function walkImages(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      out.push(...walkImages(full));
    } else if (/\.(png|jpe?g|webp)$/i.test(name)) {
      out.push(full);
    }
  }
  return out;
}

function walkXlsx(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      out.push(...walkXlsx(full));
    } else if (/\.(xlsx|xls|csv)$/i.test(name)) {
      out.push(full);
    }
  }
  return out;
}

/* ------------------------------ Xlsx parsing ------------------------------ */

function headerMatches(h: unknown, patterns: RegExp[]): boolean {
  if (typeof h !== "string") return false;
  return patterns.some((rx) => rx.test(h));
}

const ID_PATTERNS = [
  /^id$/i,
  /^라벨$/,
  /^코드$/,
  /^번호$/,
  /^파일/,
  /^이름$/,
  /^file/i,
  /^no\.?$/i,
];
const PROMPT_PATTERNS = [
  /^제목$/,
  /^prompt$/i,
  /^프롬프트$/,
  /^내용$/,
  /^설명$/,
  /^이미지$/,
  /prompt/i,
  /프롬프트/,
];
const NEGATIVE_PATTERNS = [/negative/i, /부정/];
const MODEL_PATTERNS = [/model/i, /모델/];

function parseWorkbook(filePath: string): ExtractedRow[] {
  const wb = XLSX.readFile(filePath);
  const rows: ExtractedRow[] = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });
    if (data.length === 0) continue;

    const headers = Object.keys(data[0]);
    const idCol = headers.find((h) => headerMatches(h, ID_PATTERNS));
    const promptCol = headers.find((h) => headerMatches(h, PROMPT_PATTERNS));
    const negCol = headers.find((h) => headerMatches(h, NEGATIVE_PATTERNS));
    const modelCol = headers.find((h) => headerMatches(h, MODEL_PATTERNS));

    if (!promptCol) {
      log(`  ⚠ sheet "${sheetName}": prompt 컬럼을 찾지 못함 — 스킵`);
      continue;
    }

    // "P-001 - prompt..." 처럼 한 컬럼에 id+prompt가 같이 있는 경우 분리
    const INLINE_ID = /^\s*([A-Z]+-\d{1,4})\s*[-–—:.|]\s*([\s\S]+)$/;

    data.forEach((row, i) => {
      const rawPrompt = String(row[promptCol] ?? "").trim();
      if (!rawPrompt) return;
      const idFromCol = idCol ? String(row[idCol] ?? "").trim() : "";

      let id = idFromCol;
      let prompt = rawPrompt;
      if (!id) {
        const m = rawPrompt.match(INLINE_ID);
        if (m) {
          id = m[1].trim();
          prompt = m[2].trim();
        }
      }
      if (!id) id = `${sheetName}-${i + 2}`;

      rows.push({
        id,
        prompt,
        negativePrompt: negCol ? String(row[negCol] ?? "").trim() || undefined : undefined,
        model: modelCol ? String(row[modelCol] ?? "").trim() || undefined : undefined,
        source: { file: path.basename(filePath), sheet: sheetName, row: i + 2 },
      });
    });
    log(
      `  ✓ sheet "${sheetName}": ${data.length}행 → prompt=${promptCol}${
        idCol ? `, id=${idCol}` : ""
      }`
    );
  }
  return rows;
}

/* ----------------------------- Matching logic ----------------------------- */

/** id 정규화: `C-001` `c_01` `C 1` `1` 모두 `C-001` 형태로 */
function normalizeId(raw: string): string[] {
  const cleaned = raw
    .trim()
    .replace(/\s+/g, "")
    .replace(/[_\s]/g, "-")
    .toUpperCase();
  const variants = new Set<string>([cleaned]);
  const m = cleaned.match(/^([A-Z]+)[-]?(\d+)$/);
  if (m) {
    const letter = m[1];
    const num = parseInt(m[2], 10);
    variants.add(`${letter}-${String(num).padStart(3, "0")}`);
    variants.add(`${letter}-${String(num).padStart(2, "0")}`);
    variants.add(`${letter}-${num}`);
    variants.add(`${letter}${num}`);
  }
  // 순수 숫자
  const onlyNum = cleaned.match(/^(\d+)$/);
  if (onlyNum) {
    const n = parseInt(onlyNum[1], 10);
    variants.add(String(n));
    variants.add(String(n).padStart(3, "0"));
  }
  return Array.from(variants);
}

function makeFileKey(filePath: string): string[] {
  const base = path.basename(filePath, path.extname(filePath));
  return normalizeId(base);
}

/* --------------------------------- Main --------------------------------- */

async function processImage(
  src: string,
  id: string
): Promise<{
  original: string;
  large: string;
  medium: string;
  thumb: string;
  blurDataURL: string;
  width: number;
  height: number;
}> {
  ensureDir(path.join(PUBLIC_IMAGES, "original"));
  ensureDir(path.join(PUBLIC_IMAGES, "large"));
  ensureDir(path.join(PUBLIC_IMAGES, "medium"));
  ensureDir(path.join(PUBLIC_IMAGES, "thumb"));

  const image = sharp(src);
  const meta = await image.metadata();
  const width = meta.width ?? 1024;
  const height = meta.height ?? 1024;

  // 원본 복사 (webp 변환)
  const originalOut = path.join(PUBLIC_IMAGES, "original", `${id}.webp`);
  const largeOut = path.join(PUBLIC_IMAGES, "large", `${id}.webp`);
  const mediumOut = path.join(PUBLIC_IMAGES, "medium", `${id}.webp`);
  const thumbOut = path.join(PUBLIC_IMAGES, "thumb", `${id}.webp`);

  await sharp(src).webp({ quality: 90 }).toFile(originalOut);

  await sharp(src)
    .resize(SIZES.large, SIZES.large, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(largeOut);

  await sharp(src)
    .resize(SIZES.medium, SIZES.medium, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(mediumOut);

  await sharp(src)
    .resize(SIZES.thumb, SIZES.thumb, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(thumbOut);

  // blur placeholder (16px → base64)
  const blurBuf = await sharp(src)
    .resize(16, 16, { fit: "inside" })
    .webp({ quality: 40 })
    .toBuffer();
  const blurDataURL = `data:image/webp;base64,${blurBuf.toString("base64")}`;

  return {
    original: `/images/original/${id}.webp`,
    large: `/images/large/${id}.webp`,
    medium: `/images/medium/${id}.webp`,
    thumb: `/images/thumb/${id}.webp`,
    blurDataURL,
    width,
    height,
  };
}

async function main() {
  ensureDir(CONTENT_DIR);
  log("▸ Scanning raw/");
  const images = walkImages(RAW_DIR);
  log(`  found ${images.length} image file(s)`);
  const spreadsheets = walkXlsx(RAW_DIR);
  log(`  found ${spreadsheets.length} spreadsheet(s)`);

  const overrides: OverrideMap = fs.existsSync(OVERRIDES_PATH)
    ? JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf8"))
    : {};

  log("▸ Parsing spreadsheets");
  let rows: ExtractedRow[] = [];
  for (const ss of spreadsheets) {
    log(`  reading ${path.basename(ss)}`);
    rows.push(...parseWorkbook(ss));
  }

  // batch manifest (JSONL) — runner.ts 가 생성한 프롬프트·카테고리 소스
  if (fs.existsSync(BATCH_MANIFEST)) {
    log(`▸ Reading batch manifest: ${path.relative(ROOT, BATCH_MANIFEST)}`);
    const lines = fs
      .readFileSync(BATCH_MANIFEST, "utf8")
      .split("\n")
      .filter((l) => l.trim().length > 0);
    const seen = new Set<string>();
    let added = 0;
    for (const line of lines) {
      try {
        const rec = JSON.parse(line);
        const id = String(rec.id || "").trim();
        const prompt = String(rec.prompt || "").trim();
        if (!id || !prompt || seen.has(id)) continue;
        seen.add(id);
        rows.push({
          id,
          prompt,
          source: { file: "batch/manifest.jsonl" },
          forcedCategory:
            rec.category && rec.categoryLabel
              ? { slug: String(rec.category), label: String(rec.categoryLabel) }
              : undefined,
        });
        added++;
      } catch {
        // skip malformed line
      }
    }
    log(`  ✓ batch manifest: ${added}행`);
  }

  // 사이드카 .txt / .md
  log("▸ Scanning sidecar text files");
  const textFiles = walkXlsx.call(null as never, RAW_DIR) as string[]; // noop — just for typing
  void textFiles;
  for (const imgPath of images) {
    const base = imgPath.replace(/\.(png|jpe?g|webp)$/i, "");
    for (const ext of [".txt", ".md", ".json"]) {
      if (fs.existsSync(base + ext)) {
        const content = fs.readFileSync(base + ext, "utf8").trim();
        if (content) {
          const id = path.basename(base);
          if (!rows.find((r) => normalizeId(r.id).includes(id.toUpperCase()))) {
            rows.push({
              id,
              prompt: ext === ".json" ? (JSON.parse(content).prompt ?? "") : content,
              source: { file: path.basename(base + ext) },
            });
          }
        }
      }
    }
  }

  log(`  total prompt rows: ${rows.length}`);

  /* ------- ID 매칭: image → row (동일 id는 먼저 등장한 것 우선 = 시트1 우선) ------- */
  log("▸ Matching images to prompts");
  const rowIndex = new Map<string, ExtractedRow>();
  for (const r of rows) {
    for (const v of normalizeId(r.id)) {
      if (!rowIndex.has(v)) rowIndex.set(v, r);
    }
  }

  const skipped: { file: string; reason: string }[] = [];
  const entries: Array<ExtractedRow & { srcPath: string }> = [];

  for (const imgPath of images) {
    const keys = makeFileKey(imgPath);
    const match = keys.map((k) => rowIndex.get(k)).find(Boolean);
    if (!match) {
      skipped.push({
        file: path.relative(RAW_DIR, imgPath),
        reason: `no prompt match (tried: ${keys.join(", ")})`,
      });
      continue;
    }
    entries.push({ ...match, srcPath: imgPath });
  }

  log(`  ✓ matched: ${entries.length}`);
  log(`  ✗ skipped (no prompt): ${skipped.length}`);

  /* ------- 리사이즈 + 결과 entry 생성 (병렬) ------- */
  log(`▸ Processing images (resize + blur) — parallelism=8`);
  const outEntries: Array<{
    id: string;
    prompt: string;
    negativePrompt?: string;
    category: string;
    categoryLabel: string;
    domains: string[];
    formats: string[];
    tags: string[];
    model?: string;
    sourceFolder: string;
    images: Awaited<ReturnType<typeof processImage>>;
    createdAt: string;
  }> = [];

  const CONCURRENCY = 8;
  let cursor = 0;
  let done = 0;
  const startedAt = Date.now();

  async function worker() {
    while (cursor < entries.length) {
      const my = cursor++;
      const e = entries[my];
      const safeId = e.id.replace(/[^a-zA-Z0-9-_]/g, "_");
      try {
        const imageAssets = await processImage(e.srcPath, safeId);
        const override = overrides[safeId] ?? overrides[e.id];
        const prompt = override?.prompt ?? e.prompt;
        const tags = override?.tags ?? extractTags(prompt);
        const classified = classify(prompt);
        const cat = override?.category
          ? { slug: override.category, label: override.category }
          : e.forcedCategory
            ? e.forcedCategory
            : classified.category;

        outEntries.push({
          id: safeId,
          prompt,
          negativePrompt: e.negativePrompt,
          domains: classified.domains,
          formats: classified.formats,
          category: cat.slug,
          categoryLabel: cat.label,
          tags,
          model: e.model,
          sourceFolder: path.relative(RAW_DIR, path.dirname(e.srcPath)),
          images: imageAssets,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        skipped.push({ file: e.srcPath, reason: `process error: ${(err as Error).message}` });
      }
      done++;
      if (done % 25 === 0 || done === entries.length) {
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
        log(`  ... ${done}/${entries.length}  (${elapsed}s)`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  // outEntries 정렬 (id 오름차순)
  outEntries.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  /* ------- 집계 (카테고리·도메인·포맷) ------- */
  const DOMAIN_LABELS = Object.fromEntries(DOMAINS.map((d) => [d.slug, d.label]));
  const FORMAT_LABELS = Object.fromEntries(FORMATS.map((f) => [f.slug, f.label]));

  const categoryCounts: Record<string, { label: string; count: number; cover?: string }> = {};
  const domainCounts: Record<string, number> = {};
  const formatCounts: Record<string, number> = {};

  for (const e of outEntries) {
    if (!categoryCounts[e.category]) {
      categoryCounts[e.category] = { label: e.categoryLabel, count: 0, cover: e.images.thumb };
    }
    categoryCounts[e.category].count++;
    for (const d of e.domains) domainCounts[d] = (domainCounts[d] || 0) + 1;
    for (const f of e.formats) formatCounts[f] = (formatCounts[f] || 0) + 1;
  }

  const categories = Object.entries(categoryCounts)
    .map(([slug, v]) => ({ slug, label: v.label, count: v.count, cover: v.cover }))
    .sort((a, b) => b.count - a.count);
  const domains = Object.entries(domainCounts)
    .map(([slug, count]) => ({ slug, label: DOMAIN_LABELS[slug] ?? slug, count }))
    .sort((a, b) => b.count - a.count);
  const formats = Object.entries(formatCounts)
    .map(([slug, count]) => ({ slug, label: FORMAT_LABELS[slug] ?? slug, count }))
    .sort((a, b) => b.count - a.count);

  const manifest = {
    generatedAt: new Date().toISOString(),
    totalEntries: outEntries.length,
    skippedCount: skipped.length,
    categories,
    domains,
    formats,
    entries: outEntries,
  };

  fs.writeFileSync(
    path.join(CONTENT_DIR, "prompts.json"),
    JSON.stringify(manifest, null, 2)
  );
  fs.writeFileSync(
    path.join(CONTENT_DIR, "skipped.log"),
    skipped.map((s) => `${s.file}\t${s.reason}`).join("\n") + "\n"
  );

  log("▸ Done");
  log(`  entries:    ${outEntries.length}`);
  log(`  categories: ${categories.length}`);
  log(`  skipped:    ${skipped.length}`);
  log(`  output:     content/prompts.json`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
