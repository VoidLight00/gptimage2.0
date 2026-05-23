---
name: gipt-reference-research
description: GPT Image 2.0 공개 사례를 조사해 카테고리, 구도, 프롬프트 패턴만 추출한다. 이미지나 프롬프트 원문을 복제하지 않고 한국어 first-party 페어 제작 레퍼런스로 정리할 때 사용한다.
---

# gipt-reference-research

## 목적

GPT Image 2.0 공개 갤러리와 prompt guide를 레퍼런스로 분석하되, 원본 이미지·프롬프트 복제를 피하고 추상 패턴만 추출한다.

## 절차

1. GPT Image 2.0 전용성이 명확한 source만 후보로 둔다.
2. 각 source를 `official`, `community`, `commercial-gallery`, `github-repo`로 분류한다.
3. 이미지-프롬프트 페어가 있더라도 라이선스가 불명확하면 import 후보가 아니라 inspiration 후보로 둔다.
4. 추출 내용은 카테고리, 구도, 용도, 프롬프트 구조, 금지 복제 요소로 제한한다.
5. 결과는 `reference-map.json`과 `source-ledger.md`로 저장한다.

## 출력 필드

- `sourceUrl`
- `sourceType`
- `gptImage2Specificity`: high | medium | low
- `reuseStatus`: importable | link-only | inspiration-only | blocked
- `patterns`
- `doNotCopy`
- `recommendedCategories`
