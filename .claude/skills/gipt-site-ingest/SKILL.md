---
name: gipt-site-ingest
description: 통과한 GPT Image 2.0 한국어 first-party 페어를 gptimage2.0 사이트 콘텐츠 schema와 asset 구조로 변환하고 ingest/build/route QA를 준비한다.
---

# gipt-site-ingest

## 목적

QA 통과 페어를 사이트에 재현 가능하게 반영한다.

## 원칙

- 직접 generated output만 고치지 말고 source 입력 파일을 만든다.
- first-party 페어는 별도 source manifest로 관리한다.
- 기존 `web/scripts/ingest.ts` 흐름을 깨지 않는다.
- 이미지 경로는 실제 public asset 존재 여부와 함께 검증한다.

## 권장 출력

- `_workspace/gipt-curation/<run_id>/ingest/firstparty.ko.json`
- `_workspace/gipt-curation/<run_id>/ingest/asset-manifest.json`
- 사이트 적용 후 변경 파일 목록

## 사이트 QA 체크

- `npm --prefix web run lint`
- `npm --prefix web run build`
- `/ko`, `/ko/c`, `/ko/search`, 신규 상세 페이지 샘플
- 이미지 400/404 없음
- prompt copy 정상
- attribution/source/license 정상
