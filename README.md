# GPTIMAGE 2.0

GPT 이미지 + 프롬프트 아카이브. `raw/`의 이미지와 스프레드시트를 읽어
카테고리별로 정리된 정적 갤러리 사이트를 빌드한다.

**Live**: https://gptimage2-0.vercel.app
**Repo**: https://github.com/VoidLight00/gptimage2.0

## 구조
```
gptimage2.0/
├── raw/                  # 원본 이미지 + GPT프롬프트.xlsx (gitignored)
│   └── 덕테이프 이미지 생성 및 시트/
│       ├── 이미지/       # P-XXX.png (xlsx 시트와 매칭)
│       ├── CODEX제작/    # C-XXX.png
│       └── GPT프롬프트.xlsx
├── web/                  # Next.js 16 앱
│   ├── content/
│   │   ├── prompts.json  # ingest 결과 (빌드 입력)
│   │   ├── overrides.json  # 개별 항목 override
│   │   └── skipped.log   # 매칭 실패 목록
│   ├── scripts/
│   │   ├── ingest.ts     # 파이프라인
│   │   └── categorize.ts # 키워드 분류기 (15 카테고리)
│   ├── src/app/          # /, /c, /c/[slug], /p/[id], /search, /about
│   ├── src/components/
│   └── public/images/    # ingest가 webp 4종 생성 (gitignored)
└── tools/
    ├── download_fast.py  # 드라이브 직접 HTTP 병렬 다운로더 (16 workers)
    ├── download_all.py   # gdown 기반 백업 다운로더
    ├── download_retry.py # 실패 파일 재시도
    └── publish.sh        # ingest → build → deploy → push 원샷
```

## 사용

### 최초 셋업
```bash
cd ~/Projects/gptimage2.0

# 1) 드라이브에서 이미지 + xlsx 다운로드
python3 -m venv tools/.venv
tools/.venv/bin/pip install gdown requests
tools/.venv/bin/python3 tools/download_fast.py /tmp/gdown.log

# 2) 파이프라인 + 빌드 + 배포
cd web
npm install
npm run ingest          # → content/prompts.json + public/images/*
npm run dev             # http://localhost:3000
```

### 변경 후 재배포 (원샷)
```bash
bash tools/publish.sh "feat: 신규 프롬프트 추가"
# == npm run ingest && npm run build && vercel --prod && git push
```

## 규칙
- **프롬프트 있는 이미지만 수록** (없으면 `skipped.log`에 기록하고 스킵)
- xlsx 자동 인식: 헤더 `라벨|제목`, `ID|Prompt`, `코드|내용` 등 한/영 혼용
- 시트 한 컬럼에 `P-001 - 프롬프트...` 형태라도 자동 split
- 카테고리는 프롬프트 키워드로 자동 분류 — 한국어 콘텐츠 크리에이터 용도에 튜닝 (ad·thumbnail·cardnews·crm·space·food·travel·portrait·fashion·character·landscape·product·health·education·poster)
- `overrides.json` 으로 개별 카테고리/태그 수동 보정:
  ```json
  { "P-005": { "category": "product", "tags": ["k-beauty", "serum"] } }
  ```

## 테마
`DESIGN-x.ai.md` 기반 모노크롬 (`#1f2228` + `#ffffff`) · GeistMono 디스플레이 ·
제로 shadow · 0px radius · 호버는 밝아지지 않고 `opacity 0.5`로 dimmed
