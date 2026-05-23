---
name: gipt-korean-prompt-writing
description: GPT Image 2.0 전용 한국어 first-party 이미지 생성 프롬프트를 작성한다. 카테고리 seed를 받아 title, prompt, negativePrompt, tags, intendedUse를 batch로 만들 때 사용한다.
---

# gipt-korean-prompt-writing

## 목적

한국어 사용자가 이해하고 재사용할 수 있으며 GPT Image 2.0이 안정적으로 해석할 수 있는 first-party 프롬프트를 만든다.

## 프롬프트 구성

각 프롬프트는 다음 정보를 자연스럽게 포함한다.

1. 주 피사체와 목적
2. 한국어 맥락 또는 사용처
3. 구도와 화면비
4. 배경과 소품
5. 조명, 재질, 색감
6. 카메라 또는 그래픽 스타일
7. 제외할 요소

## 금지

- 외부 프롬프트 번역·패러프레이즈
- 실존 브랜드 로고 직접 생성
- 유명인·저작권 캐릭터 유사 묘사
- 과도한 한글 본문 렌더링 요구
- 워터마크, UI 상표, fake logo 유도

## 출력 schema

```json
{
  "id": "GIPT-KO-0001",
  "title": "제목",
  "category": "ad-key-visual",
  "domains": ["marketing"],
  "format": "square",
  "tags": ["광고", "제품", "한국어"],
  "intendedUse": "SNS 광고 키비주얼",
  "prompt": "한국어 프롬프트",
  "negativePrompt": "깨진 한글, 워터마크, 가짜 로고, 저해상도",
  "model": "GPT Image 2.0"
}
```
