---
name: gipt-curation-pipeline
description: gptimage2.0 큐레이션 봇. GPT Image 2.0 전용 한국어 first-party 이미지-프롬프트 페어를 100→300→500→1000개 규모로 기획, 작성, 생성, 검수, 사이트 적용까지 운영한다. "큐레이션 봇", "GPT Image 2.0 한국어 페어", "first-party 페어", "이미지-프롬프트 100개", "gptimage2.0 데이터셋 확장", "재실행", "resume", "status", "batch 생성" 요청 시 반드시 사용한다.
---

# gipt-curation-pipeline

## 역할

`gipt-curation-pipeline`은 gptimage2.0 큐레이션 봇의 오케스트레이터 스킬이다. 외부 GPT Image 2.0 사례를 복제하지 않고, 한국어 first-party 이미지-프롬프트 페어를 기획·생성·검수·사이트 적용하는 팀 작업을 조율한다.

## 실행 모드

- `plan`: 목표 수량, 카테고리 분배, batch 계획만 만든다.
- `draft`: 이미지 생성 전 프롬프트와 메타데이터만 작성한다.
- `generate`: QA 통과 프롬프트로 이미지를 생성한다.
- `ingest`: 통과 페어를 사이트 schema와 asset 구조로 변환한다.
- `qa`: 사이트 적용 결과를 검증한다.
- `status`: 최근 run 상태를 요약한다.
- `resume`: 중단된 run을 이어서 진행한다.

## 에이전트 팀

| 에이전트 | 역할 |
|---|---|
| `gipt-conductor` | run manifest, phase 게이트, batch 진행률 관리 |
| `gipt-reference-researcher` | GPT Image 2.0 레퍼런스 패턴 분석 |
| `gipt-taxonomist` | 카테고리·도메인·포맷·검색 의도 분배 |
| `gipt-prompt-writer` | 한국어 first-party 프롬프트 작성 |
| `gipt-prompt-qa` | 프롬프트 품질·안전성 검수 |
| `gipt-image-generator` | 승인된 백엔드로 이미지 batch 생성 |
| `gipt-image-qa` | 이미지-프롬프트 일치도와 공개 품질 검수 |
| `gipt-ingest-builder` | 사이트 콘텐츠 schema와 asset manifest 변환 |
| `gipt-site-qa` | 검색·카테고리·상세·이미지 로딩 QA |

## 워크플로우

0. **자가 진단 개선 루프**
   - 하네스 실행 중 문제가 생기면 보고로 멈추지 않는다.
   - 즉시 비용·로그 낭비가 나는 백그라운드 작업을 중지하고, 실패 로그에서 비밀값 없이 원인을 분류한다.
   - 원인이 반복 가능한 환경·스크립트·워크플로우 문제이면 하네스 문서와 bundled script를 함께 수정한다.
   - 수정 후 preflight 또는 최소 샘플 재현으로 같은 문제가 안 터지는지 확인하고, 기존 산출물을 재사용해 작업을 재개한다.
   - API 키, gateway URL, 토큰, 쿠키는 진단 로그·보고·manifest에 남기지 않는다.

1. **Context 확인**
   - `_workspace/gipt-curation/latest.json`이 있으면 기존 run 상태를 확인한다.
   - 새 목표가 주어지면 새 run을 만든다.
   - 부분 요청이면 해당 phase만 재실행한다.

2. **Reference 분석**
   - GPT Image 2.0 공식/커뮤니티 사례에서 카테고리와 프롬프트 패턴만 추출한다.
   - 이미지와 프롬프트 원문은 복제하지 않는다.

3. **Taxonomy 계획**
   - 목표 수량을 기존 사이트 카테고리와 한국어 검색 의도에 맞춰 분배한다.
   - 100개는 대표성, 300개 이상은 long-tail coverage를 우선한다.

4. **Prompt 작성**
   - batch 단위로 한국어 first-party 프롬프트와 메타데이터를 작성한다.
   - 각 항목은 id, title, category, domains, format, tags, intendedUse, prompt, negativePrompt를 포함한다.

5. **Prompt QA**
   - 품질, 중복, 상표·유명인·저작권 리스크, GPT Image 2.0 적합성을 검수한다.
   - 통과 항목만 이미지 생성으로 넘긴다.

6. **Image 생성**
   - 사용자 승인된 백엔드로 batch 생성한다.
   - 생성 API 호출 전 gateway healthcheck와 이미지 변환 preflight를 먼저 통과해야 한다.
   - PNG 원본과 응답 JSON은 재개 가능한 캐시로 취급하고, 변환 실패 시 이미 받은 응답을 재사용한다.
   - 비용과 실패 항목을 manifest에 기록한다.

7. **Image QA**
   - 프롬프트 일치도, 한글 깨짐, 워터마크, 가짜 로고, 사이트 공개 품질을 검수한다.

8. **Site ingest**
   - 통과 페어를 first-party source manifest와 public asset 구조로 변환한다.
   - 기존 ingest 흐름을 깨지 않는다.

9. **Site QA**
   - lint/build와 주요 route, 이미지 로딩, search, attribution을 검증한다.

## 산출물 경로

`_workspace/gipt-curation/<run_id>/`

```
research/reference-map.json
taxonomy/category-plan.json
taxonomy/topic-seeds.jsonl
prompts/batch-<nn>.jsonl
qa/prompt-qa-batch-<nn>.json
images/batch-<nn>/
qa/image-qa-batch-<nn>.json
ingest/firstparty.ko.json
ingest/asset-manifest.json
qa/site-qa.md
RUN_MANIFEST.json
```

## 안전 제약

- 외부 이미지나 프롬프트 원문을 라이선스 없이 복제하지 않는다.
- GPT Image 2.0 전용성이 불명확한 항목은 first-party 생산 레퍼런스로만 둔다.
- 실존 브랜드 로고, 유명인, 저작권 캐릭터, 워터마크 유도는 금지한다.
- 이미지 생성 비용이 발생하는 phase는 사용자 승인 후 진행한다.
- git push, Vercel deploy, 외부 게시 상태 변경은 사용자 승인 후 진행한다.
- API 키, 쿠키, 토큰, 게이트웨이 비밀 정보는 산출물에 남기지 않는다.
- 환경 실패가 반복되면 해당 실패를 하네스 규칙과 스크립트 preflight로 일반화해 다음 실행에서 사전 차단한다.

## 테스트 시나리오

### 정상 흐름

사용자: “gptimage2.0 큐레이션 봇으로 GPT Image 2.0 한국어 페어 100개 계획부터 만들어줘.”

기대 동작: plan 모드로 run을 만들고 reference 분석, taxonomy 계획, batch 계획까지 산출한다. 이미지 생성은 승인 전 진행하지 않는다.

### 에러 흐름

사용자: “외부 GPT Image 2.0 갤러리 이미지를 그대로 가져와서 100개 넣어줘.”

기대 동작: 라이선스 불명확한 외부 이미지 복제를 차단하고, reference-only 분석 후 first-party 재생성 플로우를 제안한다.
