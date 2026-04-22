#!/usr/bin/env python3
"""Drive 파일 ID 기반 직접 HTTP 다운로드.
gdown subprocess 없이 requests 세션으로 병렬 처리.

작은 파일(<100MB) 공유 링크는 단일 GET으로 받을 수 있어 매우 빠르다.
"""
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests

LOG = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/tmp/gdown.log")
ROOT = Path(__file__).resolve().parent.parent / "raw" / "덕테이프 이미지 생성 및 시트"
P_DIR = ROOT / "이미지"
C_DIR = ROOT / "CODEX제작"
P_DIR.mkdir(parents=True, exist_ok=True)
C_DIR.mkdir(parents=True, exist_ok=True)

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17 Safari/605.1.15"


def parse_log():
    items = []
    seen = set()
    for line in LOG.read_text().splitlines():
        m = re.search(r"Processing file (\S+)\s+((?:P|C)-\d+\.png)", line)
        if not m:
            continue
        fid, name = m.group(1), m.group(2)
        if fid in seen:
            continue
        seen.add(fid)
        items.append((fid, name))
    return items


def target(name):
    if name.startswith("P-"):
        return P_DIR / name
    return C_DIR / name


def already_ok(p):
    return p.exists() and p.stat().st_size > 10_000


def download_one(session, fid, name, retries=2):
    dest = target(name)
    if already_ok(dest):
        return name, "skip", True
    url = f"https://drive.google.com/uc?export=download&id={fid}"
    for attempt in range(retries + 1):
        try:
            r = session.get(url, stream=True, timeout=30, allow_redirects=True)
            ct = r.headers.get("content-type", "")
            if "text/html" in ct:
                # confirmation HTML → parse the confirm token
                body = r.text
                m = re.search(r'name="confirm" value="([^"]+)"', body) or re.search(
                    r"confirm=([0-9A-Za-z_-]+)", body
                )
                uuid_m = re.search(r'name="uuid" value="([^"]+)"', body)
                if m:
                    params = {"export": "download", "id": fid, "confirm": m.group(1)}
                    if uuid_m:
                        params["uuid"] = uuid_m.group(1)
                    r = session.get(
                        "https://drive.usercontent.google.com/download",
                        params=params,
                        stream=True,
                        timeout=30,
                    )
                else:
                    return name, f"html-no-confirm attempt={attempt}", False
            if r.status_code != 200:
                if attempt < retries:
                    continue
                return name, f"HTTP {r.status_code}", False
            tmp = dest.with_suffix(dest.suffix + ".part")
            size = 0
            with open(tmp, "wb") as f:
                for chunk in r.iter_content(chunk_size=65536):
                    if chunk:
                        f.write(chunk)
                        size += len(chunk)
            if size < 10_000:
                tmp.unlink(missing_ok=True)
                if attempt < retries:
                    continue
                return name, f"too small ({size}B)", False
            tmp.rename(dest)
            return name, f"ok ({size//1024}KB)", True
        except Exception as e:
            if attempt < retries:
                continue
            return name, f"err {e}", False
    return name, "retry-exhausted", False


def main():
    items = parse_log()
    items.sort(key=lambda x: (0 if x[1].startswith("P-") else 1, x[1]))
    todo = [it for it in items if not already_ok(target(it[1]))]
    print(f"total={len(items)} done={len(items) - len(todo)} todo={len(todo)}")

    session = requests.Session()
    session.headers.update({"User-Agent": UA})

    ok = fail = 0
    failed = []
    with ThreadPoolExecutor(max_workers=16) as ex:
        futs = {ex.submit(download_one, session, fid, name): name for fid, name in todo}
        for i, fut in enumerate(as_completed(futs), 1):
            name, status, success = fut.result()
            if success:
                ok += 1
            else:
                fail += 1
                failed.append((name, status))
            if i % 25 == 0 or i == len(todo):
                print(f"[{i}/{len(todo)}] ok={ok} fail={fail} last={name} {status}")

    print(f"\nDONE ok={ok} fail={fail}")
    if failed:
        print("\nfailed (first 15):")
        for n, s in failed[:15]:
            print(f"  {n}  {s}")


if __name__ == "__main__":
    main()
