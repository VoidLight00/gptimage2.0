#!/usr/bin/env bash
# batch/retry-all.sh — 실패 분량 재시도 + ingest + 배포 원샷
# 사용: bash batch/retry-all.sh
set -euo pipefail

cd "$(dirname "$0")/.."

export MESHGATE_BASE=http://100.66.91.74:10531/v1
export MESHGATE_KEY=sk-tail-188febd3d95ca73dcd97831a0e3b2aab601719250ef09d11

echo "=== 한도 리셋 체크 ==="
RESETS_IN=$(jq -r '.failed | to_entries[0].value.last_error' batch/state/beauty.state.json 2>/dev/null \
  | grep -oE 'resets_in_seconds":[0-9]+' | head -1 | cut -d: -f2)
if [ -n "${RESETS_IN:-}" ] && [ "$RESETS_IN" -gt 30 ]; then
  echo "  아직 ${RESETS_IN}초 남음 ($((RESETS_IN/60))분). 잠시 뒤 다시 실행."
  exit 1
fi

echo "=== 각 카테고리 재시도 (state에 failed인 것만 재실행됨) ==="
for plan in beauty travel food fashion crm; do
  echo "▸ $plan"
  bun run batch/runner.ts batch/plans/$plan.yaml 2>&1 | tail -3
done

echo ""
echo "=== manifest 재빌드 ==="
python3 - <<'PY'
import json, yaml, pathlib, time
STATE_DIR = pathlib.Path("batch/state")
MANIFEST = pathlib.Path("batch/manifest.jsonl")
PLANS = pathlib.Path("batch/plans")

def shuffle_det(arr, seed=42):
    out = list(arr); s = seed
    for i in range(len(out)-1, 0, -1):
        s = (s * 9301 + 49297) % 233280
        j = int((s / 233280) * (i + 1))
        out[i], out[j] = out[j], out[i]
    return out

def cartesian(lists):
    result = [[]]
    for lst in lists:
        result = [r + [v] for r in result for v in lst]
    return result

def build_prompts(plan):
    keys = list(plan["variables"].keys())
    lists = [plan["variables"][k] for k in keys]
    selected = shuffle_det(cartesian(lists))[:plan["count"]]
    out = []
    for i, values in enumerate(selected):
        ctx = dict(zip(keys, values))
        prompt = plan["template"].strip()
        for k, v in ctx.items():
            prompt = prompt.replace(f"{{{k}}}", v)
        pid = f"{plan['prefix']}-{str(i+1).zfill(4)}"
        out.append((pid, prompt))
    return out

id2prompt = {}; labels = {}
for p in PLANS.glob("*.yaml"):
    plan = yaml.safe_load(p.read_text())
    labels[plan["category"]] = plan["label"]
    for pid, prompt in build_prompts(plan):
        id2prompt[pid] = (plan["category"], plan["label"], prompt)

MANIFEST.unlink(missing_ok=True)
added = 0
with MANIFEST.open("w") as mf:
    for sf in sorted(STATE_DIR.glob("*.state.json")):
        s = json.loads(sf.read_text())
        for mid, meta in s["completed"].items():
            if mid not in id2prompt: continue
            cat, label, prompt = id2prompt[mid]
            rec = {
                "id": mid, "category": cat, "categoryLabel": label,
                "prompt": prompt, "revisedPrompt": meta.get("revised"),
                "image": meta.get("path"), "bytes": meta.get("bytes"),
                "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%S"),
            }
            mf.write(json.dumps(rec, ensure_ascii=False) + "\n")
            added += 1
print(f"manifest rebuilt: {added} entries")
PY

echo ""
echo "=== 최종 상태 ==="
for f in batch/state/*.json; do
  n=$(basename "$f" .state.json); d=$(jq '.completed | length' "$f"); x=$(jq '.failed | length' "$f")
  t=$(grep "^count:" batch/plans/$n.yaml | awk '{print $2}')
  echo "  $n: $d/$t (실패 $x)"
done

echo ""
echo "=== publish ==="
bash tools/publish.sh "feat: retry remaining batch images after plus limit reset"
