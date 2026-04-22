#!/usr/bin/env python3
"""gdown log에서 모든 파일 ID + 이름을 추출해 병렬로 다운로드.

P-시리즈는 raw/덕테이프 이미지 생성 및 시트/이미지/
C-시리즈는 raw/덕테이프 이미지 생성 및 시트/CODEX제작/
"""
import re
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

LOG = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("/tmp/gdown.log")
ROOT = Path(__file__).resolve().parent.parent / "raw" / "덕테이프 이미지 생성 및 시트"
GDOWN = Path(__file__).resolve().parent / ".venv" / "bin" / "gdown"

P_DIR = ROOT / "이미지"
C_DIR = ROOT / "CODEX제작"
P_DIR.mkdir(parents=True, exist_ok=True)
C_DIR.mkdir(parents=True, exist_ok=True)

LINE = re.compile(r"Processing file (\S+?)\s+(.+?)\.png\s*$|Processing file (\S+) (.+?\.png)$")


def parse():
    items = []
    seen = set()
    for raw in LOG.read_text().splitlines():
        # 두 가지 패턴: "Processing file ID NAME.png" 또는
        #              "Processing file ID NAME.pngRetrieving folder..."
        m = re.search(r"Processing file (\S+)\s+((?:P|C)-\d+\.png)", raw)
        if not m:
            continue
        fid, name = m.group(1), m.group(2)
        if fid in seen:
            continue
        seen.add(fid)
        items.append((fid, name))
    return items


def target_for(name: str) -> Path:
    if name.startswith("P-"):
        return P_DIR / name
    if name.startswith("C-"):
        return C_DIR / name
    return ROOT / name


def already_ok(path: Path) -> bool:
    return path.exists() and path.stat().st_size > 10_000  # >10KB 안전판


def download(fid: str, name: str) -> tuple[str, str, bool]:
    target = target_for(name)
    if already_ok(target):
        return (name, "skip", True)
    try:
        r = subprocess.run(
            [str(GDOWN), fid, "-O", str(target), "-q"],
            capture_output=True,
            timeout=90,
        )
        ok = already_ok(target)
        return (name, "ok" if ok else f"fail: {r.stderr.decode()[:200]}", ok)
    except subprocess.TimeoutExpired:
        return (name, "timeout", False)
    except Exception as e:
        return (name, f"err: {e}", False)


def main():
    items = parse()
    print(f"total files in log: {len(items)}")
    # P 시리즈를 먼저 (xlsx 프롬프트와 매칭됨), 그 다음 C
    items.sort(key=lambda x: (0 if x[1].startswith("P-") else 1, x[1]))
    remaining = [it for it in items if not already_ok(target_for(it[1]))]
    print(f"already downloaded: {len(items) - len(remaining)}")
    print(f"to download: {len(remaining)}")

    ok_cnt = 0
    fail_cnt = 0
    failed = []
    with ThreadPoolExecutor(max_workers=4) as ex:
        futures = {ex.submit(download, fid, name): (fid, name) for fid, name in remaining}
        for i, fut in enumerate(as_completed(futures), 1):
            name, status, ok = fut.result()
            if ok:
                ok_cnt += 1
            else:
                fail_cnt += 1
                failed.append((futures[fut][0], name, status))
            if i % 25 == 0 or i == len(remaining):
                print(f"  [{i}/{len(remaining)}] ok={ok_cnt} fail={fail_cnt}  last={name} {status[:40]}")

    print(f"\nDONE. ok={ok_cnt} fail={fail_cnt}")
    if failed:
        print("\nfailed (first 20):")
        for fid, name, status in failed[:20]:
            print(f"  {name}  ({fid})  {status[:80]}")


if __name__ == "__main__":
    main()
