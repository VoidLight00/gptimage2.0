---
name: gipt-image-generation
description: QA 통과 한국어 프롬프트를 GPT Image 2.0 이미지로 batch 생성하고 생성 manifest를 남긴다. 실제 이미지 생성 단계에서만 사용하며 비용·백엔드 승인을 확인한다.
---

# gipt-image-generation

## 목적

검수된 프롬프트로 GPT Image 2.0 이미지를 생성하고, 재생성 가능한 manifest를 남긴다.

## 실행 전 확인

- 사용자가 이미지 생성 비용과 백엔드를 승인했는가
- prompt QA가 pass인가
- batch 크기가 정해졌는가
- 출력 경로가 `_workspace/gipt-curation/<run_id>/images/`인가
- gateway healthcheck가 통과했는가
- PNG→WebP 변환 preflight가 통과했는가

## 생성 규칙

- 기본 batch 크기: 20개
- 파일명: `{id}.png`
- 생성 결과는 `generation-manifest-batch-<nn>.json`에 기록한다.
- 실패 항목은 `failed`, `retryable`, `blocked`로 분류한다.
- 생성 응답 JSON과 raw PNG는 재개 가능한 캐시로 보존한다.
- 변환기 문제처럼 생성 API와 무관한 실패는 추가 생성 호출 전에 작업을 중지하고 스크립트/preflight를 수정한 뒤 재개한다.

## 자가 진단 개선

- 문제가 발생하면 단순 보고로 끝내지 않고 원인을 `gateway`, `generation`, `conversion`, `filesystem`, `site-ingest` 중 하나로 분류한다.
- 같은 오류가 2개 이상 반복되면 batch를 중지하고 하네스 규칙 또는 bundled script를 수정한다.
- 수정 후 preflight 또는 이미 생성된 raw PNG 1개로 재현 테스트를 통과해야 batch를 재개한다.

## 보안

API 키, gateway URL, 세션 쿠키, 토큰은 어떤 산출물에도 기록하지 않는다.
