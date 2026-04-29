#!/usr/bin/env python3
"""Phase 3 (rag-mirror) — prompts3 media mirror.

Reads snapshot manifest+raw, applies filters, downloads media in parallel
with per-host throttling, generates webp variants (320/640/1024/1920) and
blurhash, writes media/<run_id>/<id>/* and media/<run_id>/manifest.json.

Backend selection:
  - if /Users/voidlight/.config/voidlight/r2.json exists, use R2 (not yet here);
  - else: local backend (files served from local_prefix).
"""
from __future__ import annotations

import asyncio
import hashlib
import io
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

import ssl

import aiohttp
import blurhash
import certifi
from PIL import Image

USER_AGENT = "gptimage2.0-rag-mirror/1.0 (+https://gptimage2-0.vercel.app)"
SOURCE_BASE = "https://prompts3.com/"
RUN_ID = "20260428-151811-prompts3"
ROOT = Path("/Users/voidlight/projects/gptimage2.0/_workspace/rag")
SNAPSHOT_DIR = ROOT / "snapshots" / RUN_ID
MEDIA_DIR = ROOT / "media" / RUN_ID
RAW_DIR = Path("/Users/voidlight/projects/gptimage2.0/raw/prompts3") / RUN_ID
CONFIG_PATH = ROOT / "config" / "mirror.json"
R2_CONFIG_PATH = Path("/Users/voidlight/.config/voidlight/r2.json")

NS_PREFIX = "p3-"
SIZES = (320, 640, 1024, 1920)
TARGET_TOTAL_FOR_PROGRESS = 0  # set after filtering


def now_utc_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sha256_bytes(b: bytes) -> str:
    h = hashlib.sha256()
    h.update(b)
    return h.hexdigest()


def detect_backend() -> str:
    if R2_CONFIG_PATH.exists():
        try:
            data = json.loads(R2_CONFIG_PATH.read_text())
            if all(k in data for k in ("account_id", "access_key_id", "secret_access_key", "bucket")):
                return "r2"
        except Exception:
            pass
    return "local"


def load_inputs() -> tuple[dict, list[dict], dict]:
    config = json.loads(CONFIG_PATH.read_text())
    manifest = json.loads((SNAPSHOT_DIR / "manifest.json").read_text())
    raw = json.loads((SNAPSHOT_DIR / "raw.json").read_text())
    prompts = raw["prompts"]
    return config, prompts, manifest


def apply_filters(prompts: list[dict], filters: dict) -> list[dict]:
    langs = set(filters.get("languages", []))
    out = []
    for p in prompts:
        if filters.get("exclude_ours_true") and p.get("ours") is True:
            continue
        if langs and p.get("language") not in langs:
            continue
        if filters.get("require_image") and not p.get("image"):
            continue
        if filters.get("require_thumb") and not p.get("thumb"):
            continue
        out.append(p)
    return out


def normalize_id(raw_id: Any) -> str:
    return f"{NS_PREFIX}{raw_id}"


def build_jobs(records: list[dict]) -> list[dict]:
    jobs = []
    for p in records:
        pid = normalize_id(p["id"])
        full_url = urljoin(SOURCE_BASE, p["image"])
        thumb_url = urljoin(SOURCE_BASE, p["thumb"])
        jobs.append(
            {
                "id": pid,
                "raw_id": p["id"],
                "language": p.get("language"),
                "full_url": full_url,
                "thumb_url": thumb_url,
                "same_as_thumb": full_url == thumb_url,
            }
        )
    return jobs


# --- per-host gating ---------------------------------------------------------
class HostLimiter:
    def __init__(self, per_host: int):
        self.per_host = per_host
        self.locks: dict[str, asyncio.Semaphore] = {}

    def get(self, url: str) -> asyncio.Semaphore:
        host = urlparse(url).netloc
        if host not in self.locks:
            self.locks[host] = asyncio.Semaphore(self.per_host)
        return self.locks[host]


async def fetch_bytes(
    session: aiohttp.ClientSession,
    url: str,
    host_lim: HostLimiter,
    retries: int = 2,
) -> tuple[bytes, dict]:
    sem = host_lim.get(url)
    last_exc = None
    for attempt in range(retries + 1):
        try:
            async with sem:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=60)) as r:
                    if r.status != 200:
                        raise RuntimeError(f"HTTP {r.status}")
                    data = await r.read()
                    headers = {
                        "etag": r.headers.get("etag"),
                        "content_type": r.headers.get("content-type"),
                        "content_length": r.headers.get("content-length"),
                        "last_modified": r.headers.get("last-modified"),
                    }
                    return data, headers
        except Exception as e:
            last_exc = e
            if attempt < retries:
                await asyncio.sleep(0.5 * (2 ** attempt))
                continue
            raise
    raise last_exc  # pragma: no cover


def make_variants(image_bytes: bytes, dest_dir: Path) -> dict[str, dict]:
    """Generate webp variants and blurhash. Returns {variant: {path, bytes}}."""
    variants: dict[str, dict] = {}
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    w, h = img.size
    for size in SIZES:
        if w >= size or h >= size:
            ratio = min(size / w, size / h)
            new_size = (max(1, int(w * ratio)), max(1, int(h * ratio)))
            resized = img.resize(new_size, Image.LANCZOS)
        else:
            resized = img.copy()
        out_path = dest_dir / f"w{size}.webp"
        resized.save(out_path, format="WEBP", quality=80, method=4)
        variants[f"w{size}"] = {
            "path": str(out_path.relative_to(MEDIA_DIR)),
            "bytes": out_path.stat().st_size,
            "width": resized.size[0],
            "height": resized.size[1],
        }
    # blurhash from a small thumbnail
    bh_img = img.copy()
    bh_img.thumbnail((64, 64), Image.LANCZOS)
    arr = list(bh_img.getdata())
    # blurhash.encode wants pixel arrays as numpy or list-of-list
    pixels = [list(arr[r * bh_img.size[0]:(r + 1) * bh_img.size[0]]) for r in range(bh_img.size[1])]
    # convert to nested list of [r,g,b]
    pixels_rgb = [[list(px[:3]) if isinstance(px, tuple) else [px, px, px] for px in row] for row in pixels]
    try:
        bh = blurhash.encode(pixels_rgb, 4, 3)
    except Exception:
        # fallback via numpy if available
        bh = ""
    (dest_dir / "blurhash.txt").write_text(bh)
    return {"variants": variants, "blurhash": bh, "orig_size": (w, h)}


def detect_ext(content_type: str | None, url: str) -> str:
    if content_type:
        if "jpeg" in content_type or "jpg" in content_type:
            return ".jpg"
        if "png" in content_type:
            return ".png"
        if "webp" in content_type:
            return ".webp"
        if "gif" in content_type:
            return ".gif"
    # fallback to URL extension
    p = urlparse(url).path
    ext = os.path.splitext(p)[1].lower()
    return ext or ".bin"


async def process_one(
    job: dict,
    session: aiohttp.ClientSession,
    host_lim: HostLimiter,
    backend: str,
    retries: int,
) -> dict:
    pid = job["id"]
    item_dir = MEDIA_DIR / pid
    raw_item_dir = RAW_DIR / pid
    item_dir.mkdir(parents=True, exist_ok=True)
    raw_item_dir.mkdir(parents=True, exist_ok=True)

    result: dict = {
        "id": pid,
        "raw_id": job["raw_id"],
        "language": job["language"],
        "source_full": job["full_url"],
        "source_thumb": job["thumb_url"],
        "uploaded_at": now_utc_iso(),
        "backend": backend,
    }
    try:
        full_bytes, full_h = await fetch_bytes(session, job["full_url"], host_lim, retries=retries)
        if job["same_as_thumb"]:
            thumb_bytes, thumb_h = full_bytes, full_h
        else:
            thumb_bytes, thumb_h = await fetch_bytes(session, job["thumb_url"], host_lim, retries=retries)

        full_ext = detect_ext(full_h.get("content_type"), job["full_url"])
        thumb_ext = detect_ext(thumb_h.get("content_type"), job["thumb_url"])

        full_path = item_dir / f"full{full_ext}"
        thumb_path = item_dir / f"thumb{thumb_ext}"
        full_path.write_bytes(full_bytes)
        thumb_path.write_bytes(thumb_bytes)
        # mirror to raw/ as immutable origin store
        (raw_item_dir / f"full{full_ext}").write_bytes(full_bytes)
        if not job["same_as_thumb"]:
            (raw_item_dir / f"thumb{thumb_ext}").write_bytes(thumb_bytes)

        variant_info = make_variants(full_bytes, item_dir)

        result.update(
            {
                "etag_full": full_h.get("etag"),
                "etag_thumb": thumb_h.get("etag"),
                "sha256_full": sha256_bytes(full_bytes),
                "sha256_thumb": sha256_bytes(thumb_bytes),
                "bytes_full": len(full_bytes),
                "bytes_thumb": len(thumb_bytes),
                "blurhash": variant_info["blurhash"],
                "orig_width": variant_info["orig_size"][0],
                "orig_height": variant_info["orig_size"][1],
                "variants": {k: v["path"] for k, v in variant_info["variants"].items()},
                "variant_bytes": {k: v["bytes"] for k, v in variant_info["variants"].items()},
                "full_path": str(full_path.relative_to(MEDIA_DIR)),
                "thumb_path": str(thumb_path.relative_to(MEDIA_DIR)),
                "ok": True,
            }
        )
        return result
    except Exception as e:
        result.update({"ok": False, "error": f"{type(e).__name__}: {e}"})
        return result


async def main() -> int:
    config, prompts, snap_manifest = load_inputs()
    backend = detect_backend()
    if backend != config.get("preferred_backend") and not config.get("allow_fallback"):
        print(f"ERR: backend {backend} but allow_fallback=false", file=sys.stderr)
        return 2

    filters = config["filters"]
    records = apply_filters(prompts, filters)
    jobs = build_jobs(records)
    total = len(jobs)
    print(f"[mirror] backend={backend} total_records={total}", flush=True)

    concurrency = int(config["download"].get("concurrency", 16))
    per_host = int(config["download"].get("per_host", 4))
    retries = int(config["download"].get("retry", 2))

    sem = asyncio.Semaphore(concurrency)
    host_lim = HostLimiter(per_host)

    timeout = aiohttp.ClientTimeout(total=120)
    ssl_ctx = ssl.create_default_context(cafile=certifi.where())
    connector = aiohttp.TCPConnector(limit=concurrency * 2, ttl_dns_cache=300, ssl=ssl_ctx)
    headers = {"User-Agent": USER_AGENT, "Accept": "image/*,*/*;q=0.5"}

    items: list[dict] = []
    failures: list[dict] = []
    bytes_total = 0
    started = time.time()

    async with aiohttp.ClientSession(headers=headers, connector=connector, timeout=timeout) as session:
        async def worker(job):
            async with sem:
                return await process_one(job, session, host_lim, backend, retries)

        # progress
        done = 0
        ok = 0
        fail = 0
        tasks = [asyncio.create_task(worker(j)) for j in jobs]
        for fut in asyncio.as_completed(tasks):
            res = await fut
            done += 1
            if res.get("ok"):
                ok += 1
                bytes_total += res.get("bytes_full", 0) + res.get("bytes_thumb", 0)
                items.append(res)
            else:
                fail += 1
                failures.append(res)
            if done % 100 == 0 or done == total:
                elapsed = time.time() - started
                rate = done / elapsed if elapsed > 0 else 0
                print(
                    f"[mirror] {done}/{total} ok={ok} fail={fail} "
                    f"bytes={bytes_total/1_048_576:.1f}MiB rate={rate:.1f}/s",
                    flush=True,
                )

    elapsed = time.time() - started

    # Compute language breakdown
    by_lang: dict[str, int] = {}
    for it in items:
        by_lang[it["language"]] = by_lang.get(it["language"], 0) + 1

    variant_total: dict[str, int] = {f"w{s}": 0 for s in SIZES}
    variant_bytes_total: dict[str, int] = {f"w{s}": 0 for s in SIZES}
    for it in items:
        for k, v in it.get("variants", {}).items():
            variant_total[k] = variant_total.get(k, 0) + 1
        for k, v in it.get("variant_bytes", {}).items():
            variant_bytes_total[k] = variant_bytes_total.get(k, 0) + v

    manifest = {
        "run_id": RUN_ID,
        "agent": "rag-mirror",
        "agent_version": "1.0",
        "generated_at": now_utc_iso(),
        "backend": backend,
        "backend_note": (
            "R2 credentials not configured at ~/.config/voidlight/r2.json; "
            "falling back to local backend per config.allow_fallback=true."
            if backend == "local"
            else "R2 backend"
        ),
        "source_host": "prompts3.com",
        "source_base": SOURCE_BASE,
        "namespace_prefix": NS_PREFIX,
        "filters_applied": filters,
        "concurrency": concurrency,
        "per_host": per_host,
        "image_pipeline": [f"webp@{s}" for s in SIZES] + ["blurhash"],
        "local_prefix": config["output"].get("local_prefix"),
        "stats": {
            "total_filtered": total,
            "attempted": total,
            "ok": len(items),
            "fail": len(failures),
            "fail_rate": round(len(failures) / total, 4) if total else 0.0,
            "bytes": bytes_total,
            "duration_sec": round(elapsed, 2),
            "by_language": by_lang,
            "variant_count": variant_total,
            "variant_bytes": variant_bytes_total,
        },
        "items": sorted(items, key=lambda x: x["id"]),
    }

    (MEDIA_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2))

    if failures:
        with open(MEDIA_DIR / "failures.jsonl", "w") as f:
            for fr in failures:
                f.write(json.dumps(fr, ensure_ascii=False) + "\n")

    # Top failure reasons
    from collections import Counter

    reasons = Counter(fr.get("error", "unknown") for fr in failures)
    print("\n[mirror] DONE", flush=True)
    print(f"  attempted={total} ok={len(items)} fail={len(failures)}", flush=True)
    print(f"  bytes={bytes_total/1_048_576:.1f}MiB elapsed={elapsed:.1f}s", flush=True)
    print(f"  by_language={by_lang}", flush=True)
    print(f"  variants_count={variant_total}", flush=True)
    if reasons:
        print("  top failure reasons:", flush=True)
        for r, c in reasons.most_common(5):
            print(f"    {c}x  {r}", flush=True)
    print(f"  manifest: {MEDIA_DIR/'manifest.json'}", flush=True)
    if failures:
        print(f"  failures: {MEDIA_DIR/'failures.jsonl'}", flush=True)
    return 0 if (len(failures) / total if total else 0) < 0.05 else 3


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
