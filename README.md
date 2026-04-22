# GPTIMAGE 2.0

GPT 이미지 + 프롬프트 아카이브. `raw/`의 이미지와 스프레드시트를 읽어
카테고리별로 정리된 정적 사이트를 빌드한다.

## 구조
```
gptimage2.0/
├── raw/              # 원본 이미지 + 프롬프트 xlsx/csv (gitignored)
├── content/
│   ├── prompts.json  # ingest 결과 (빌드 입력)
│   ├── overrides.json  # id → category/prompt/tags 수동 override
│   └── skipped.log   # 프롬프트 매칭 실패 목록
├── web/              # Next.js 앱
│   ├── scripts/
│   │   ├── ingest.ts       # 파이프라인
│   │   └── categorize.ts   # 키워드 분류기
│   ├── src/
│   │   ├── app/            # 라우트
│   │   ├── components/
│   │   └── lib/
│   └── public/images/      # ingest가 생성 (gitignored)
└── tools/            # 보조 도구 (gdown 등)
```

## 사용
```bash
# 1) raw/ 디렉토리에 이미지 + GPT프롬프트.xlsx 배치
cd web
npm install
npm run ingest     # → content/prompts.json, public/images/* 생성
npm run dev        # 로컬 확인
npm run build      # 프로덕션 빌드
```

## 규칙
- **프롬프트 없는 이미지는 자동 스킵** (skipped.log에 기록)
- 카테고리는 프롬프트 키워드 기반 자동 분류
- `content/overrides.json` 으로 개별 항목 override 가능:
  ```json
  { "C-001": { "category": "portrait", "tags": ["backlight", "moody"] } }
  ```

## 테마
`DESIGN-x.ai.md` 기반 모노크롬 (`#1f2228` + `#ffffff`) · GeistMono 디스플레이
