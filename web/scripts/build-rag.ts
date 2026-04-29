#!/usr/bin/env node
/**
 * RAG embedding index builder.
 *
 * 입력: web/content/rag.search.json (2,898 entries)
 * 출력:
 *   - web/content/rag.text.bin  (float32 LE, shape=[N, dim])
 *   - web/content/rag.meta.json (mode=embedded, indexReady=true, dimensions, model)
 *
 * 백엔드 자동 선택 (env 우선순위):
 *   1. OPENAI_API_KEY            → text-embedding-3-small (1536d, $0.02/1M tok)
 *   2. VOYAGE_API_KEY            → voyage-3 (1024d)
 *   3. JINA_API_KEY              → jina-embeddings-v3 (1024d)
 *   4. (fallback) 인덱스 빌드 안 함, meta.indexReady=false 유지
 *
 * 사용법:
 *   OPENAI_API_KEY=sk-... npx tsx web/scripts/build-rag.ts
 */

import { promises as fs } from "node:fs";
import path from "node:path";

type Entry = {
  id: string;
  language: string;
  title?: string;
  prompt?: string;
  category?: string;
  categoryLabel?: string;
  tags?: string[];
};

const ROOT = path.resolve(process.cwd());
const SEARCH_PATH = path.join(ROOT, "content", "rag.search.json");
const META_PATH = path.join(ROOT, "content", "rag.meta.json");
const BIN_PATH = path.join(ROOT, "content", "rag.text.bin");

const BATCH_SIZE = 100;
const INPUT_TEMPLATE = "{language} | {category} | {title}\n{prompt_first_400}";
const PROMPT_TRUNCATE = 400;

type Backend = {
  name: string;
  model: string;
  dim: number;
  call: (texts: string[]) => Promise<number[][]>;
};

function pickBackend(): Backend | null {
  if (process.env.OPENAI_API_KEY) {
    const key = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-small";
    const dim = process.env.OPENAI_EMBED_MODEL?.includes("large") ? 3072 : 1536;
    return {
      name: "openai",
      model,
      dim,
      call: async (texts) => {
        const res = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({ model, input: texts }),
        });
        if (!res.ok) throw new Error(`openai ${res.status}: ${await res.text()}`);
        const data = (await res.json()) as { data: { embedding: number[] }[] };
        return data.data.map((d) => d.embedding);
      },
    };
  }
  if (process.env.VOYAGE_API_KEY) {
    const key = process.env.VOYAGE_API_KEY;
    const model = "voyage-3";
    return {
      name: "voyage",
      model,
      dim: 1024,
      call: async (texts) => {
        const res = await fetch("https://api.voyageai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({ model, input: texts }),
        });
        if (!res.ok) throw new Error(`voyage ${res.status}: ${await res.text()}`);
        const data = (await res.json()) as { data: { embedding: number[] }[] };
        return data.data.map((d) => d.embedding);
      },
    };
  }
  if (process.env.JINA_API_KEY) {
    const key = process.env.JINA_API_KEY;
    const model = "jina-embeddings-v3";
    return {
      name: "jina",
      model,
      dim: 1024,
      call: async (texts) => {
        const res = await fetch("https://api.jina.ai/v1/embeddings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({ model, input: texts, task: "retrieval.passage" }),
        });
        if (!res.ok) throw new Error(`jina ${res.status}: ${await res.text()}`);
        const data = (await res.json()) as { data: { embedding: number[] }[] };
        return data.data.map((d) => d.embedding);
      },
    };
  }
  return null;
}

function buildInputText(e: Entry): string {
  const promptHead = (e.prompt ?? "").slice(0, PROMPT_TRUNCATE);
  return INPUT_TEMPLATE.replace("{language}", e.language ?? "?")
    .replace("{category}", e.categoryLabel ?? e.category ?? "?")
    .replace("{title}", e.title ?? "")
    .replace("{prompt_first_400}", promptHead);
}

async function chunkArray<T>(arr: T[], size: number, fn: (chunk: T[], i: number) => Promise<void>) {
  for (let i = 0; i < arr.length; i += size) {
    await fn(arr.slice(i, i + size), i);
  }
}

function vectorsToBuffer(vectors: number[][]): Buffer {
  const flat = vectors.flat();
  const buf = Buffer.allocUnsafe(flat.length * 4);
  for (let i = 0; i < flat.length; i++) buf.writeFloatLE(flat[i], i * 4);
  return buf;
}

async function writeMeta(extra: Record<string, unknown>) {
  const existing = JSON.parse(await fs.readFile(META_PATH, "utf-8"));
  await fs.writeFile(META_PATH, JSON.stringify({ ...existing, ...extra }, null, 2));
}

async function main() {
  const backend = pickBackend();
  if (!backend) {
    console.error("[build-rag] No embedding backend env var found.");
    console.error("  Set one of: OPENAI_API_KEY, VOYAGE_API_KEY, JINA_API_KEY");
    console.error("  Skipping. Site continues in fallback (token) search mode.");
    process.exit(2);
  }

  console.log(`[build-rag] backend=${backend.name} model=${backend.model} dim=${backend.dim}`);

  const entries = JSON.parse(await fs.readFile(SEARCH_PATH, "utf-8")) as Entry[];
  console.log(`[build-rag] entries=${entries.length}, batch_size=${BATCH_SIZE}`);

  const inputs = entries.map(buildInputText);
  const allVectors: number[][] = [];
  let done = 0;

  await chunkArray(inputs, BATCH_SIZE, async (chunk) => {
    let attempt = 0;
    while (attempt < 5) {
      try {
        const vectors = await backend.call(chunk);
        allVectors.push(...vectors);
        done += vectors.length;
        process.stdout.write(`\r[build-rag] ${done}/${entries.length} (${Math.round((done / entries.length) * 100)}%)`);
        return;
      } catch (e) {
        attempt += 1;
        const wait = 1000 * 2 ** attempt;
        console.error(`\n[build-rag] retry attempt=${attempt} wait=${wait}ms err=${(e as Error).message}`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
    throw new Error(`[build-rag] gave up after 5 attempts at offset ${done}`);
  });

  console.log("\n[build-rag] writing binary index...");
  await fs.writeFile(BIN_PATH, vectorsToBuffer(allVectors));

  const built = {
    indexReady: true,
    mode: "embedded",
    backend: backend.name,
    model: backend.model,
    dimensions: backend.dim,
    binary: "rag.text.bin",
    inputTemplate: INPUT_TEMPLATE,
    promptTruncate: PROMPT_TRUNCATE,
    entryCount: entries.length,
    builtAt: new Date().toISOString(),
    blockedReason: null,
  };
  await writeMeta(built);

  console.log(`[build-rag] OK. ${entries.length} vectors × ${backend.dim} dim → ${BIN_PATH}`);
  console.log(`[build-rag] meta updated → indexReady=true mode=embedded`);
}

main().catch((e) => {
  console.error("[build-rag] FATAL", e);
  process.exit(1);
});
