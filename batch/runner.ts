#!/usr/bin/env -S bun run
/**
 * batch/runner.ts — meshgate 기반 카테고리 배치 이미지 생성기
 *
 * 사용:
 *   bun run batch/runner.ts batch/plans/beauty.yaml           # 전체 실행
 *   bun run batch/runner.ts batch/plans/beauty.yaml --limit 3  # 샘플 3장
 *   bun run batch/runner.ts batch/plans/beauty.yaml --dry-run  # 프롬프트만 출력
 *
 * 환경변수 (둘 다 필수):
 *   MESHGATE_BASE  http://<TAILSCALE_IP>:10531/v1
 *   MESHGATE_KEY   sk-tail-...
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import YAML from "yaml";

// ---------- 타입 ----------
type Plan = {
  category: string;
  label: string;
  count: number;
  prefix: string; // e.g. B-BEAUTY → ID가 B-BEAUTY-0001 형태
  out_dir: string; // 프로젝트 루트 기준 상대 경로
  size?: string; // "1024x1024"
  quality?: "high" | "medium" | "low";
  template: string; // {key} 치환
  variables: Record<string, string[]>;
};

type StateFile = {
  plan: string;
  started_at: string;
  completed: Record<
    string,
    { path: string; bytes: number; prompt?: string; revised?: string }
  >;
  failed: Record<string, { tries: number; last_error: string }>;
};

type GenTask = {
  id: string; // B-BEAUTY-0001
  prompt: string;
  index: number; // 1-based
};

// ---------- 유틸 ----------
const PROJECT_ROOT = resolve(import.meta.dir, "..");
const STATE_DIR = join(PROJECT_ROOT, "batch", "state");
const MANIFEST_PATH = join(PROJECT_ROOT, "batch", "manifest.jsonl");

const ANSI = {
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(msg: string) {
  const t = new Date().toLocaleTimeString("ko-KR", { hour12: false });
  console.log(`${ANSI.dim}[${t}]${ANSI.reset} ${msg}`);
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.length === 0) {
    console.error(`${ANSI.red}ERROR:${ANSI.reset} 환경변수 ${name} 가 비어있습니다.`);
    console.error(`  export MESHGATE_BASE=http://<TAILSCALE_IP>:10531/v1`);
    console.error(`  export MESHGATE_KEY=sk-tail-...`);
    process.exit(2);
  }
  return v;
}

function ensureDir(p: string) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

// ---------- 조합 전개 ----------
function cartesian<T>(lists: T[][]): T[][] {
  return lists.reduce<T[][]>(
    (acc, list) => acc.flatMap((row) => list.map((v) => [...row, v])),
    [[]]
  );
}

function shuffle<T>(arr: T[], seed = 42): T[] {
  // 결정적 셔플 — 같은 seed면 같은 순서
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildPrompts(plan: Plan): GenTask[] {
  const keys = Object.keys(plan.variables);
  const lists = keys.map((k) => plan.variables[k]);
  const allCombos = cartesian(lists);
  log(
    `  변수 ${keys.length}개 × 값 [${lists.map((l) => l.length).join(",")}] = 총 조합 ${allCombos.length}개`
  );

  const shuffled = shuffle(allCombos);
  const selected = shuffled.slice(0, plan.count);

  return selected.map((values, i) => {
    const ctx: Record<string, string> = {};
    keys.forEach((k, idx) => (ctx[k] = values[idx]));
    let prompt = plan.template.trim();
    for (const [k, v] of Object.entries(ctx)) {
      prompt = prompt.replaceAll(`{${k}}`, v);
    }
    const id = `${plan.prefix}-${String(i + 1).padStart(4, "0")}`;
    return { id, prompt, index: i + 1 };
  });
}

// 업스트림의 usage_limit_reached → resets_in_seconds 를 파싱
function parseResetsIn(raw: string): number | undefined {
  const m = raw.match(/resets_in_seconds"\s*:\s*(\d+)/);
  return m ? parseInt(m[1], 10) : undefined;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

class RateLimited extends Error {
  readonly waitSec: number;
  constructor(waitSec: number, body: string) {
    super(`rate_limited, wait ${waitSec}s: ${body.slice(0, 160)}`);
    this.waitSec = waitSec;
  }
}

// ---------- meshgate 호출 ----------
async function generateOne(
  base: string,
  key: string,
  task: GenTask,
  plan: Plan,
  outPath: string
): Promise<{ bytes: number; revised?: string }> {
  const body = {
    prompt: task.prompt,
    size: plan.size ?? "1024x1024",
    quality: plan.quality ?? "high",
  };
  const res = await fetch(`${base}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    // 429 usage_limit_reached → 별도 예외 (메인 루프에서 sleep)
    if (res.status === 429 || /usage_limit_reached/.test(text)) {
      const wait = parseResetsIn(text) ?? 900;
      throw new RateLimited(wait, text);
    }
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const parsed = JSON.parse(text);
  if (parsed.error) {
    throw new Error(`upstream: ${JSON.stringify(parsed.error).slice(0, 200)}`);
  }
  const b64 = parsed?.data?.[0]?.b64_json;
  if (!b64) throw new Error("응답에 b64_json 없음");
  const revised = parsed.data[0].revised_prompt as string | undefined;
  const buf = Buffer.from(b64, "base64");
  ensureDir(dirname(outPath));
  writeFileSync(outPath, buf);
  return { bytes: buf.length, revised };
}

// ---------- 메인 ----------
async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      limit: { type: "string" },
      "dry-run": { type: "boolean" },
      seed: { type: "string" },
    },
    allowPositionals: true,
  });

  const planPath = positionals[0];
  if (!planPath) {
    console.error("usage: runner.ts <plan.yaml> [--limit N] [--dry-run]");
    process.exit(1);
  }

  const absPlan = resolve(process.cwd(), planPath);
  if (!existsSync(absPlan)) {
    console.error(`plan not found: ${absPlan}`);
    process.exit(1);
  }

  const raw = readFileSync(absPlan, "utf8");
  const plan = YAML.parse(raw) as Plan;

  log(
    `${ANSI.bold}plan${ANSI.reset} ${plan.category} / ${plan.label} / count=${plan.count} / prefix=${plan.prefix}`
  );

  const tasks = buildPrompts(plan);
  const limit = values.limit ? parseInt(values.limit, 10) : tasks.length;
  const selected = tasks.slice(0, limit);
  log(`  대상 ${selected.length}개 / 전체 ${tasks.length}개`);

  if (values["dry-run"]) {
    for (const t of selected.slice(0, 5)) {
      console.log(`\n--- ${t.id} ---`);
      console.log(t.prompt);
    }
    console.log(`\n(dry-run: 총 ${selected.length}개 — 상위 5개만 출력)`);
    return;
  }

  const base = requireEnv("MESHGATE_BASE").replace(/\/$/, "");
  const key = requireEnv("MESHGATE_KEY");

  // 상태 로드/초기화
  ensureDir(STATE_DIR);
  const stateFile = join(
    STATE_DIR,
    `${plan.category}.state.json`
  );
  let state: StateFile;
  if (existsSync(stateFile)) {
    state = JSON.parse(readFileSync(stateFile, "utf8"));
    log(
      `  resume: 완료 ${Object.keys(state.completed).length} / 실패 ${Object.keys(state.failed).length}`
    );
  } else {
    state = {
      plan: plan.category,
      started_at: new Date().toISOString(),
      completed: {},
      failed: {},
    };
  }

  const outRoot = resolve(PROJECT_ROOT, plan.out_dir);
  ensureDir(outRoot);

  const manifestFd = ensureDir(dirname(MANIFEST_PATH));
  void manifestFd;
  const manifestStream = await Bun.file(MANIFEST_PATH).exists();
  void manifestStream;

  let done = Object.keys(state.completed).length;
  let newly = 0;
  let errs = 0;
  const startedAt = Date.now();

  outer: for (const t of selected) {
    if (state.completed[t.id]) continue; // resume skip
    const outPath = join(outRoot, `${t.id}.png`);

    // 최대 5회 시도: 429 만나면 resets_in + 30초 sleep 후 재시도
    let r: { bytes: number; revised?: string } | undefined;
    let attempt = 0;
    while (attempt < 5) {
      attempt++;
      try {
        r = await generateOne(base, key, t, plan, outPath);
        break;
      } catch (e) {
        if (e instanceof RateLimited) {
          const waitMs = (e.waitSec + 30) * 1000;
          log(
            `  ${ANSI.yellow}⏸${ANSI.reset} ${t.id} rate_limit — ${e.waitSec}s 대기 후 재시도 (${attempt}/5)`
          );
          await sleep(waitMs);
          continue;
        }
        // 일반 실패 → 상위 catch 로 던짐
        throw e;
      }
    }
    if (!r) {
      state.failed[t.id] = {
        tries: (state.failed[t.id]?.tries ?? 0) + 5,
        last_error: "rate_limited_after_5_retries",
      };
      writeFileSync(stateFile, JSON.stringify(state, null, 2));
      errs++;
      log(`  ${ANSI.red}✗${ANSI.reset} ${t.id} — 재시도 5회 모두 rate_limited`);
      continue outer;
    }

    try {
      state.completed[t.id] = {
        path: `${plan.out_dir}/${t.id}.png`,
        bytes: r!.bytes,
        prompt: t.prompt,
        revised: r!.revised,
      };
      delete state.failed[t.id];
      writeFileSync(stateFile, JSON.stringify(state, null, 2));

      // manifest.jsonl 에 추가 (ingest 가 프롬프트 소스로 읽음)
      const line =
        JSON.stringify({
          id: t.id,
          category: plan.category,
          categoryLabel: plan.label,
          prompt: t.prompt,
          revisedPrompt: r!.revised,
          image: `${plan.out_dir}/${t.id}.png`,
          bytes: r!.bytes,
          size: plan.size ?? "1024x1024",
          quality: plan.quality ?? "high",
          generatedAt: new Date().toISOString(),
        }) + "\n";
      await Bun.write(MANIFEST_PATH, line, {
        createPath: true,
      }).catch(async () => {
        // append
        const prev = existsSync(MANIFEST_PATH)
          ? readFileSync(MANIFEST_PATH, "utf8")
          : "";
        writeFileSync(MANIFEST_PATH, prev + line);
      });
      // 간단 append 보장
      if (existsSync(MANIFEST_PATH)) {
        const prev = readFileSync(MANIFEST_PATH, "utf8");
        if (!prev.endsWith(line)) writeFileSync(MANIFEST_PATH, prev + line);
      }

      done++;
      newly++;
      const elapsed = (Date.now() - startedAt) / 1000;
      const rate = newly / Math.max(elapsed, 1);
      const eta = Math.round((selected.length - done) / Math.max(rate, 0.001));
      log(
        `  ${ANSI.green}✓${ANSI.reset} ${t.id} (${(r!.bytes / 1024).toFixed(0)}KB) — ${done}/${selected.length} · ${rate.toFixed(2)}/s · ETA ${eta}s`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const prev = state.failed[t.id];
      state.failed[t.id] = {
        tries: (prev?.tries ?? 0) + 1,
        last_error: msg,
      };
      writeFileSync(stateFile, JSON.stringify(state, null, 2));
      errs++;
      log(`  ${ANSI.red}✗${ANSI.reset} ${t.id} — ${msg.slice(0, 120)}`);
    }
  }

  log(
    `${ANSI.bold}done${ANSI.reset} ${plan.category}: 신규 ${newly} · 누적 ${done}/${selected.length} · 에러 ${errs}`
  );
  log(`  state: ${stateFile}`);
  log(`  manifest: ${MANIFEST_PATH}`);
  log(`  images: ${outRoot}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
