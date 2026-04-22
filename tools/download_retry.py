#!/usr/bin/env python3
"""gdown log에서 '처리 대상'으로 나열된 파일 ID를 추출해,
실제 다운로드되지 않은 것만 재시도한다.

Usage:
  python tools/download_retry.py /tmp/gdown.log raw/덕테이프\ 이미지\ 생성\ 및\ 시트/CODEX제작

Google Drive 'too many access' 제한이 풀린 뒤 실행.
"""
import os
import re
import subprocess
import sys
import time
from pathlib import Path


LOG_LINE = re.compile(r"Processing file (\S+) (.+)$")


def parse_log(log_path: Path):
    """(file_id, filename) 쌍 목록 반환."""
    pairs = []
    seen = set()
    for line in log_path.read_text().splitlines():
        m = LOG_LINE.match(line.strip())
        if not m:
            continue
        fid, name = m.group(1), m.group(2).strip()
        if (fid, name) in seen:
            continue
        seen.add((fid, name))
        pairs.append((fid, name))
    return pairs


def main():
    if len(sys.argv) < 3:
        print("usage: download_retry.py <gdown-log> <output-dir> [gdown-bin]")
        sys.exit(1)
    log = Path(sys.argv[1])
    out_dir = Path(sys.argv[2])
    gdown_bin = sys.argv[3] if len(sys.argv) > 3 else str(
        Path(__file__).parent / ".venv" / "bin" / "gdown"
    )

    out_dir.mkdir(parents=True, exist_ok=True)
    pairs = parse_log(log)
    print(f"{len(pairs)} files in log")

    failed = []
    for fid, name in pairs:
        target = out_dir / name
        if target.exists() and target.stat().st_size > 0:
            continue
        print(f"→ {name} ({fid})")
        rc = subprocess.call([gdown_bin, fid, "-O", str(target)])
        if rc != 0 or not target.exists():
            failed.append((fid, name))
            time.sleep(2)
    print(f"\ndone. failed: {len(failed)}")
    if failed:
        print("retry later:")
        for fid, name in failed[:10]:
            print(f"  {fid}  {name}")


if __name__ == "__main__":
    main()
