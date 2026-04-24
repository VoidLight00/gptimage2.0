#!/usr/bin/env bash
# batch/run-all.sh — 7개 plans 순차 실행 (rate-limit 자동 대기 포함) → manifest 재빌드 → 배포
# 사용:
#   bash batch/run-all.sh            # 지금 바로
#   nohup bash batch/run-all.sh &    # 세션 끝나도 계속
#
# state에 완료된 건 자동으로 resume-skip. 실패만 재시도.

set -u
cd "$(dirname "$0")/.."

export MESHGATE_BASE=http://100.66.91.74:10531/v1
export MESHGATE_KEY=sk-tail-188febd3d95ca73dcd97831a0e3b2aab601719250ef09d11

echo "▸ runner 모드: 429 감지 시 resets_in_seconds + 30s 자동 sleep 후 재시도"

# 순차 실행 (병렬로 돌리면 Plus 계정 분당 한도 즉시 소진됨)
for plan in beauty travel food fashion crm character animation; do
  if [ ! -f "batch/plans/$plan.yaml" ]; then
    echo "  skip $plan (no yaml)"; continue
  fi
  echo ""
  echo "▸ $plan"
  bun run batch/runner.ts "batch/plans/$plan.yaml" 2>&1 | tee -a "batch/logs/$plan.log"
done

echo ""
echo "▸ manifest 재빌드"
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
    r = [[]]
    for lst in lists:
        r = [x + [v] for x in r for v in lst]
    return r
def build_prompts(plan):
    keys = list(plan["variables"].keys())
    lists = [plan["variables"][k] for k in keys]
    sel = shuffle_det(cartesian(lists))[:plan["count"]]
    out = []
    for i, values in enumerate(sel):
        ctx = dict(zip(keys, values))
        p = plan["template"].strip()
        for k, v in ctx.items():
            p = p.replace(f"{{{k}}}", v)
        pid = f"{plan['prefix']}-{str(i+1).zfill(4)}"
        out.append((pid, p))
    return out

id2 = {}; labels = {}
for p in PLANS.glob("*.yaml"):
    pl = yaml.safe_load(p.read_text())
    labels[pl["category"]] = pl["label"]
    for pid, prm in build_prompts(pl):
        id2[pid] = (pl["category"], pl["label"], prm)

MANIFEST.unlink(missing_ok=True)
added = 0
with MANIFEST.open("w") as mf:
    for sf in sorted(STATE_DIR.glob("*.state.json")):
        s = json.loads(sf.read_text())
        for mid, meta in s["completed"].items():
            if mid not in id2: continue
            cat, lab, prm = id2[mid]
            rec = {
                "id": mid, "category": cat, "categoryLabel": lab,
                "prompt": prm, "revisedPrompt": meta.get("revised"),
                "image": meta.get("path"), "bytes": meta.get("bytes"),
                "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%S"),
            }
            mf.write(json.dumps(rec, ensure_ascii=False) + "\n")
            added += 1
print(f"manifest: {added} entries")
PY

echo ""
echo "▸ 최종 요약"
for f in batch/state/*.json; do
  n=$(basename "$f" .state.json); d=$(jq '.completed | length' "$f"); x=$(jq '.failed | length' "$f")
  t=$(grep "^count:" "batch/plans/$n.yaml" 2>/dev/null | awk '{print $2}')
  echo "  $n: $d/$t (실패 $x)"
done

echo ""
echo "▸ publish (ingest + build + deploy)"
bash tools/publish.sh "feat(batch v2): ${PWD##*/} professional advertising prompts + character/animation"

echo "✓ DONE → https://gptimage2-0.vercel.app"
