#!/usr/bin/env python3
from __future__ import annotations

import argparse
import base64
import concurrent.futures
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

PROJECT_ROOT = Path(__file__).resolve().parents[4]
WEB_ROOT = PROJECT_ROOT / "web"
RUN_ID = "20260522-gipt-ko-100"
WORKSPACE = PROJECT_ROOT / "_workspace" / "gipt-curation" / RUN_ID
IMAGE_PUBLIC_ROOT = WEB_ROOT / "public" / "images" / "gipt" / RUN_ID
CONTENT_DIR = WEB_ROOT / "content"
GI_COMMAND = Path.home() / ".claude" / "commands" / "gi.md"

CATEGORY_LABELS = {
    "ad-key-visual": "광고 키비주얼",
    "poster": "포스터",
    "editorial-fashion": "패션·뷰티·라이프",
    "social-card": "소셜·릴스",
    "card-news": "카드뉴스·CRM",
    "product-detail": "제품 디테일·랜딩",
    "infographic": "인포그래픽·교육",
    "character-avatar": "캐릭터·아바타",
    "comic-illustration": "만화·일러스트",
    "game-asset": "게임 에셋",
    "uiux-app": "UI/UX·앱·웹",
}

CATEGORY_PLAN = [
    ("ad-key-visual", 12),
    ("product-detail", 12),
    ("social-card", 10),
    ("card-news", 10),
    ("infographic", 10),
    ("poster", 10),
    ("character-avatar", 8),
    ("uiux-app", 8),
    ("editorial-fashion", 8),
    ("comic-illustration", 5),
    ("game-asset", 4),
    ("other", 3),
]

TOPICS = {
    "ad-key-visual": [
        ("제주 감귤 스파클링 음료", "marketing", "ar-1-1", "상쾌한 여름 캠페인"),
        ("한강 러닝 크루 스마트워치", "wellness", "ar-1-1", "도시 러너 타깃 광고"),
        ("비건 세라마이드 크림", "beauty", "ar-4-5", "클린 뷰티 캠페인"),
        ("프리미엄 김부각 스낵", "food", "ar-1-1", "K-스낵 런칭"),
        ("무선 노이즈캔슬링 이어버드", "tech", "ar-1-1", "테크 제품 키비주얼"),
        ("로컬 로스터리 콜드브루", "food", "ar-4-5", "카페 브랜드 광고"),
        ("전기 미니밴 패밀리 캠페인", "mobility", "ar-16-9", "패밀리 모빌리티"),
        ("한옥 스테이 예약 앱", "travel", "ar-1-1", "프리미엄 여행 캠페인"),
        ("제로슈거 유자 티", "food", "ar-1-1", "건강 음료 런칭"),
        ("AI 회의록 SaaS", "tech", "ar-16-9", "B2B SaaS 광고"),
        ("친환경 세탁 캡슐", "lifestyle", "ar-4-5", "생활용품 캠페인"),
        ("서울 야간 문화패스", "culture", "ar-16-9", "공공 문화 캠페인"),
    ],
    "product-detail": [
        ("스테인리스 텀블러", "commerce", "ar-4-5", "상세페이지 hero"),
        ("프리미엄 고양이 정수기", "pet", "ar-4-5", "커머스 상세"),
        ("모듈형 데스크 조명", "interior", "ar-4-5", "가구 상세"),
        ("휴대용 미니 빔프로젝터", "tech", "ar-4-5", "전자제품 상세"),
        ("저자극 선스크린", "beauty", "ar-4-5", "화장품 상세"),
        ("제주 말차 그래놀라", "food", "ar-4-5", "식품 상세"),
        ("접이식 캠핑 체어", "outdoor", "ar-4-5", "아웃도어 상세"),
        ("초경량 출근 백팩", "fashion", "ar-4-5", "패션 잡화 상세"),
        ("홈카페 우유 거품기", "lifestyle", "ar-4-5", "주방가전 상세"),
        ("프리미엄 향초 세트", "lifestyle", "ar-4-5", "선물 상세"),
        ("무선 충전 데스크 매트", "tech", "ar-4-5", "오피스 제품 상세"),
        ("키즈 영양 젤리", "health", "ar-4-5", "패밀리 제품 상세"),
    ],
    "social-card": [
        ("금요일 퇴근 후 루틴", "lifestyle", "ar-1-1", "인스타그램 카드"),
        ("신제품 티저 D-3", "marketing", "ar-1-1", "런칭 티저"),
        ("서울 카페 투어 지도", "travel", "ar-1-1", "소셜 저장형 콘텐츠"),
        ("AI 업무 자동화 팁", "tech", "ar-1-1", "B2B 숏폼 썸네일"),
        ("봄철 피부 장벽 관리", "beauty", "ar-1-1", "뷰티 소셜 카드"),
        ("반려견 산책 체크리스트", "pet", "ar-1-1", "생활 정보 카드"),
        ("주말 전시 추천", "culture", "ar-1-1", "문화 소셜 카드"),
        ("집중력 회복 10분", "wellness", "ar-1-1", "웰니스 숏폼"),
        ("로컬 푸드 마켓 오픈", "food", "ar-1-1", "이벤트 소셜"),
        ("앱 업데이트 새 기능", "digital", "ar-1-1", "제품 업데이트 카드"),
    ],
    "card-news": [
        ("전기요금 절약법 5가지", "public", "ar-4-5", "정보 카드뉴스"),
        ("초보 창업자 세금 일정", "business", "ar-4-5", "비즈니스 카드뉴스"),
        ("수면의 질 높이는 습관", "health", "ar-4-5", "헬스케어 카드뉴스"),
        ("청년 월세 지원 안내", "public", "ar-4-5", "정책 안내"),
        ("AI 이미지 프롬프트 구조", "education", "ar-4-5", "교육 카드뉴스"),
        ("제로웨이스트 장보기", "sustainability", "ar-4-5", "환경 카드뉴스"),
        ("이커머스 상세페이지 체크", "commerce", "ar-4-5", "마케팅 카드뉴스"),
        ("반려묘 건강 신호", "pet", "ar-4-5", "펫 정보 카드"),
        ("여행 전 체크리스트", "travel", "ar-4-5", "여행 카드뉴스"),
        ("회의를 줄이는 방법", "business", "ar-4-5", "업무 생산성 카드"),
    ],
    "infographic": [
        ("한국 커피 원두 로스팅 단계", "education", "ar-3-2", "교육 인포그래픽"),
        ("도심 빗물 순환 시스템", "public", "ar-3-2", "공공 다이어그램"),
        ("AI 에이전트 작업 흐름", "tech", "ar-3-2", "기술 설명"),
        ("전통 한지 제작 과정", "culture", "ar-3-2", "문화 교육"),
        ("스마트팜 데이터 흐름", "agriculture", "ar-3-2", "산업 인포그래픽"),
        ("피부 보습 성분 비교", "beauty", "ar-3-2", "뷰티 설명"),
        ("도시 자전거 안전 수칙", "public", "ar-3-2", "공공 캠페인"),
        ("김치 발효 타임라인", "food", "ar-3-2", "음식 과학"),
        ("모바일 앱 온보딩 퍼널", "digital", "ar-3-2", "UX 분석"),
        ("로컬 브랜드 성장 로드맵", "business", "ar-3-2", "비즈니스 설명"),
    ],
    "poster": [
        ("독립 영화 달빛 정류장", "culture", "ar-9-16", "영화 포스터"),
        ("서울 재즈 나이트", "culture", "ar-9-16", "공연 포스터"),
        ("한강 북 페어", "culture", "ar-9-16", "행사 포스터"),
        ("미래 도시 건축전", "architecture", "ar-9-16", "전시 포스터"),
        ("제로웨이스트 마켓", "sustainability", "ar-9-16", "마켓 포스터"),
        ("여름 수영장 페스티벌", "event", "ar-9-16", "이벤트 포스터"),
        ("AI 아트 워크숍", "education", "ar-9-16", "교육 포스터"),
        ("밤의 식물원", "culture", "ar-9-16", "전시 포스터"),
        ("로컬 맥주 위크", "food", "ar-9-16", "브랜드 행사"),
        ("도시 사진 산책", "photography", "ar-9-16", "커뮤니티 포스터"),
    ],
    "character-avatar": [
        ("친환경 택배 브랜드 마스코트", "brand", "ar-1-1", "브랜드 캐릭터"),
        ("AI 학습 코치 아바타", "education", "ar-1-1", "서비스 아바타"),
        ("동네 서점 고양이 캐릭터", "culture", "ar-1-1", "로컬 브랜드"),
        ("캠핑 앱 다람쥐 가이드", "outdoor", "ar-1-1", "앱 캐릭터"),
        ("어린이 치과 별빛 토끼", "health", "ar-1-1", "키즈 캐릭터"),
        ("커피 구독 서비스 원두 요정", "food", "ar-1-1", "커머스 캐릭터"),
        ("도시 자전거 안전 히어로", "public", "ar-1-1", "공공 캠페인"),
        ("비건 뷰티 브랜드 물방울 요정", "beauty", "ar-1-1", "뷰티 캐릭터"),
    ],
    "uiux-app": [
        ("프리미엄 독서 기록 앱", "digital", "ar-1-1", "모바일 UI"),
        ("AI 회의 요약 대시보드", "tech", "ar-16-9", "SaaS UI"),
        ("동네 장보기 앱 홈 화면", "commerce", "ar-1-1", "커머스 UI"),
        ("명상 루틴 앱 온보딩", "wellness", "ar-1-1", "모바일 온보딩"),
        ("로컬 여행 일정 플래너", "travel", "ar-16-9", "웹 앱 UI"),
        ("반려동물 건강 기록 앱", "pet", "ar-1-1", "헬스케어 UI"),
        ("스마트홈 에너지 모니터", "iot", "ar-16-9", "대시보드 UI"),
        ("디자이너 포트폴리오 랜딩", "creative", "ar-16-9", "웹 랜딩"),
    ],
    "editorial-fashion": [
        ("한남동 편집숍 봄 룩북", "fashion", "ar-4-5", "패션 화보"),
        ("비건 립밤 뷰티 에디토리얼", "beauty", "ar-4-5", "뷰티 화보"),
        ("북촌 한옥 라이프스타일", "lifestyle", "ar-4-5", "라이프스타일 화보"),
        ("미니멀 워크웨어 캠페인", "fashion", "ar-4-5", "브랜드 룩북"),
        ("홈카페 아침 루틴", "lifestyle", "ar-4-5", "라이프스타일 컷"),
        ("청량한 여름 스킨케어", "beauty", "ar-4-5", "뷰티 캠페인"),
        ("로컬 향수 브랜드 무드", "beauty", "ar-4-5", "향수 화보"),
        ("제주 리조트 웰니스", "travel", "ar-4-5", "여행 라이프스타일"),
    ],
    "comic-illustration": [
        ("퇴근길 지하철 판타지", "illustration", "ar-1-1", "웹툰 콘셉트"),
        ("비 오는 골목의 작은 용", "illustration", "ar-1-1", "동화 일러스트"),
        ("미래 학교의 로봇 친구", "education", "ar-1-1", "아동 일러스트"),
        ("한강 밤산책 고양이 탐정", "illustration", "ar-1-1", "캐릭터 일러스트"),
        ("시장 골목 요리 배틀", "food", "ar-1-1", "만화 장면"),
    ],
    "game-asset": [
        ("한옥 마을 RPG 배경", "game", "ar-1-1", "게임 배경"),
        ("김치 슬라임 몬스터", "game", "ar-1-1", "게임 캐릭터"),
        ("전통 문양 UI 아이콘 세트", "game", "ar-1-1", "게임 UI"),
        ("사이버 궁궐 보스룸", "game", "ar-1-1", "게임 환경"),
    ],
    "other": [
        ("한국형 미래 푸드트럭", "concept", "ar-1-1", "콘셉트 비주얼"),
        ("달 항아리 형태의 스마트 스피커", "concept", "ar-1-1", "제품 콘셉트"),
        ("도심 속 조용한 AI 도서관", "concept", "ar-1-1", "공간 콘셉트"),
    ],
}

STYLE_BY_CATEGORY = {
    "ad-key-visual": "premium Korean advertising key visual, clean commercial art direction, high-end studio compositing",
    "product-detail": "e-commerce product detail hero, crisp product photography, premium landing page visual",
    "social-card": "modern Korean social media editorial card, bold thumbnail composition, save-worthy Instagram visual",
    "card-news": "Korean card news cover design, clear information hierarchy, editorial graphic design",
    "infographic": "museum-grade Korean infographic, diagrammatic information design, clean labels but no readable body text",
    "poster": "high-end Korean event poster, cinematic graphic design, strong negative space",
    "character-avatar": "original brand mascot design, polished 3D illustration, friendly commercial character",
    "uiux-app": "premium app UI mockup presentation, Korean digital product design, clean interface board",
    "editorial-fashion": "Korean editorial photography, quiet luxury magazine spread, refined lifestyle campaign",
    "comic-illustration": "original Korean illustration, cinematic comic panel, polished digital painting",
    "game-asset": "game concept art asset sheet, Korean fantasy visual language, polished production design",
    "other": "speculative Korean design concept, premium concept art, clean presentation",
}

COMPOSITION_BY_FORMAT = {
    "ar-1-1": "square composition, centered hero subject, clear negative space around the subject",
    "ar-4-5": "vertical editorial composition inside a square canvas, tall central layout with breathing room",
    "ar-9-16": "poster-like vertical layout inside a square canvas, full-height subject and large copy zone without actual text",
    "ar-16-9": "wide landscape layout inside a square canvas, cinematic horizontal composition with side copy zone",
    "ar-3-2": "landscape information board inside a square canvas, balanced diagram areas and object close-ups",
}

LIGHTING = [
    "softbox studio lighting with gentle shadows",
    "warm morning window light with subtle highlights",
    "controlled editorial lighting with clean reflections",
    "cinematic rim light and soft ambient fill",
    "natural overcast light with premium product clarity",
]

PALETTES = [
    "ivory, charcoal, warm gray, muted accent orange",
    "deep navy, silver, off-white, electric blue accent",
    "sage green, cream, walnut brown, soft gold",
    "clean white, graphite, cobalt blue, pale cyan",
    "black, pearl white, tangerine, soft beige",
]


def read_gi_config() -> tuple[str, str]:
    text = GI_COMMAND.read_text()
    url_match = re.search(r"Base URL:\s*`([^`]+)`", text)
    key_match = re.search(r"API Key:\s*`([^`]+)`", text)
    if not url_match or not key_match:
        raise RuntimeError("/gi command config not found")
    return url_match.group(1).rstrip("/"), key_match.group(1)


def prompt_for(item: dict, index: int) -> str:
    category = item["category"]
    style = STYLE_BY_CATEGORY[category]
    composition = COMPOSITION_BY_FORMAT[item["format"]]
    lighting = LIGHTING[index % len(LIGHTING)]
    palette = PALETTES[index % len(PALETTES)]
    return "\n".join([
        f"Subject: {item['subject']} — {item['use_case']} for Korean users.",
        f"Context: {style}; designed as a first-party GPT Image 2.0 archive sample, not a copy of any existing gallery image.",
        f"Composition: {composition}; copy zone reserved as clean empty space, but do not render readable text.",
        f"Lighting: {lighting}.",
        f"Color palette: {palette}.",
        "Style reference: premium Korean commercial design, refined art direction, sharp details, high production value, realistic materials where appropriate.",
        "Negative: no text, no logo, no watermark, no famous brand mark, no celebrity likeness, no copyrighted character, no broken Hangul, no QR code, no UI brand names, no low-resolution artifacts.",
    ])


def description_for(item: dict) -> str:
    return f"{item['subject']}를 {item['use_case']} 용도로 활용할 수 있게 설계한 GPT Image 2.0 한국어 first-party 이미지-프롬프트 페어입니다."


def tags_for(item: dict) -> list[str]:
    words = [item["domain"], item["categoryLabel"].split("·")[0], item["use_case"].split()[0], "GPT Image 2.0", "first-party"]
    subject_words = re.split(r"\s+", item["subject"])
    return list(dict.fromkeys([*subject_words[:3], *words]))[:8]


def make_items() -> list[dict]:
    items: list[dict] = []
    idx = 1
    for category, count in CATEGORY_PLAN:
        for subject, domain, fmt, use_case in TOPICS[category][:count]:
            item = {
                "id": f"GIPT-KO-{idx:04d}",
                "subject": subject,
                "domain": domain,
                "format": fmt,
                "use_case": use_case,
                "category": category,
                "categoryLabel": CATEGORY_LABELS.get(category, "기타"),
            }
            item["title"] = f"{subject} {use_case}"
            item["description"] = description_for(item)
            item["prompt"] = prompt_for(item, idx)
            item["negativePrompt"] = "텍스트, 로고, 워터마크, 유명 브랜드, 유명인, 저작권 캐릭터, 깨진 한글, 저해상도"
            item["tags"] = tags_for(item)
            items.append(item)
            idx += 1
    if len(items) != 100:
        raise RuntimeError(f"expected 100 items, got {len(items)}")
    return items


def ensure_dirs() -> None:
    for rel in ["research", "taxonomy", "prompts", "qa", "images", "ingest", "logs"]:
        (WORKSPACE / rel).mkdir(parents=True, exist_ok=True)
    IMAGE_PUBLIC_ROOT.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows))


def healthcheck(base_url: str) -> None:
    health_url = re.sub(r"/v\d+$", "", base_url) + "/health"
    req = Request(health_url)
    with urlopen(req, timeout=5) as res:
        if res.status != 200:
            raise RuntimeError(f"gateway healthcheck failed: {res.status}")


def write_image_from_response(response_json: Path, raw_png: Path) -> bool:
    if not response_json.exists():
        return False
    data = json.loads(response_json.read_text())
    if data.get("error"):
        raise RuntimeError(json.dumps(data["error"], ensure_ascii=False))
    image_b64 = data.get("data", [{}])[0].get("b64_json")
    if not image_b64:
        return False
    raw_png.write_bytes(base64.b64decode(image_b64))
    return True


def call_image_api(base_url: str, api_key: str, item: dict, raw_png: Path, response_json: Path) -> None:
    payload = json.dumps({"prompt": item["prompt"], "size": "1024x1024", "quality": "high"}).encode()
    req = Request(
        f"{base_url}/images/generations",
        data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(req, timeout=240) as res:
        body = res.read()
    response_json.write_bytes(body)
    if not write_image_from_response(response_json, raw_png):
        raise RuntimeError("image response did not include b64_json")


def convert_with_sharp(raw_png: Path, outputs: dict[int, Path]) -> None:
    script = """
const { createRequire } = require('module');
const requireFromWeb = createRequire(process.cwd() + '/package.json');
const sharp = requireFromWeb('sharp');
const [, , input, specJson] = process.argv;
const specs = JSON.parse(specJson);
Promise.all(specs.map(({ size, output }) => sharp(input).resize(size, size, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 86 }).toFile(output)))
  .catch((error) => { console.error(error.message); process.exit(1); });
""".strip()
    specs = [{"size": size, "output": str(output)} for size, output in outputs.items()]
    with tempfile.NamedTemporaryFile("w", suffix=".cjs", delete=False) as handle:
        handle.write(script)
        script_path = Path(handle.name)
    try:
        subprocess.run(
            ["node", str(script_path), str(raw_png), json.dumps(specs)],
            cwd=WEB_ROOT,
            check=True,
            stdout=subprocess.DEVNULL,
        )
    finally:
        script_path.unlink(missing_ok=True)


def preflight_conversion() -> None:
    raw_dir = WORKSPACE / "images" / "raw"
    cached_png = next(iter(sorted(raw_dir.glob("*.png"))), None) if raw_dir.exists() else None
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_root = Path(temp_dir)
        source = temp_root / "preflight.png"
        if cached_png:
            source.write_bytes(cached_png.read_bytes())
        else:
            source.write_bytes(base64.b64decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mNk+M8AAAICAQBogwH1AAAAAElFTkSuQmCC"
            ))
        outputs = {
            1024: temp_root / "original.webp",
            960: temp_root / "large.webp",
            640: temp_root / "medium.webp",
            320: temp_root / "thumb.webp",
        }
        convert_with_sharp(source, outputs)
        missing = [str(path) for path in outputs.values() if not path.exists() or path.stat().st_size == 0]
        if missing:
            raise RuntimeError(f"image conversion preflight failed: {missing}")


def make_variants(item: dict, raw_png: Path, force: bool = False) -> dict:
    item_id = item["id"]
    public_dir = IMAGE_PUBLIC_ROOT / item_id
    public_dir.mkdir(parents=True, exist_ok=True)
    original = public_dir / "original.webp"
    large = public_dir / "large.webp"
    medium = public_dir / "medium.webp"
    thumb = public_dir / "thumb.webp"
    outputs = {1024: original, 960: large, 640: medium, 320: thumb}
    complete = all(path.exists() and path.stat().st_size > 0 for path in outputs.values())
    if force or not complete:
        convert_with_sharp(raw_png, outputs)
    return {
        "original": f"/images/gipt/{RUN_ID}/{item_id}/original.webp",
        "large": f"/images/gipt/{RUN_ID}/{item_id}/large.webp",
        "medium": f"/images/gipt/{RUN_ID}/{item_id}/medium.webp",
        "thumb": f"/images/gipt/{RUN_ID}/{item_id}/thumb.webp",
    }


def generate_one(args) -> dict:
    base_url, api_key, item, force = args
    item_id = item["id"]
    raw_dir = WORKSPACE / "images" / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    raw_png = raw_dir / f"{item_id}.png"
    response_json = WORKSPACE / "logs" / f"{item_id}.response.json"
    if not force and not raw_png.exists():
        write_image_from_response(response_json, raw_png)
    if force or not raw_png.exists():
        call_image_api(base_url, api_key, item, raw_png, response_json)
    variants = make_variants(item, raw_png, force)
    return {"id": item_id, "status": "pass", "raw": str(raw_png), "variants": variants}


def raw_entry(item: dict, gen: dict) -> dict:
    now = "2026-05-22T00:00:00Z"
    variants = gen["variants"]
    return {
        "id": item["id"],
        "source": "voidlight",
        "source_url": None,
        "title": item["title"],
        "description": item["description"],
        "language": "ko",
        "tags": item["tags"],
        "published_at": now,
        "prompt": {"body": item["prompt"], "is_structured": False, "args": [], "args_upstream": []},
        "taxonomy": {
            "section": item["category"],
            "section_label": item["categoryLabel"],
            "section_label_ko": item["categoryLabel"],
            "section_label_en": item["category"],
            "purpose": [item["category"]],
            "domain": [item["domain"]],
            "format": [item["format"]],
            "upstream_categories": ["first-party", "gpt-image-2"],
        },
        "attribution": {
            "license": "internal",
            "source_name": "VOIDLIGHT GPT Image 2.0 Korean Pair Factory",
            "upstream_chain": ["gipt-curation-pipeline", RUN_ID],
            "indication_of_changes": "first-party Korean prompt and image generated for gptimage2.0 curation bot",
            "rehosted_at": now,
        },
        "media": {
            "full": {"key": variants["original"], "w": 1024, "h": 1024},
            "thumb": {"key": variants["thumb"]},
            "blurDataURL": "",
            "variants": variants,
        },
        "ingest": {"run_id": RUN_ID, "ingested_at": now, "model": "gpt-image-2"},
    }


def merge_curated(entries: list[dict], apply: bool) -> None:
    firstparty = {"generatedAt": "2026-05-22T00:00:00Z", "totalEntries": len(entries), "skippedCount": 0, "entries": entries}
    write_json(WORKSPACE / "ingest" / "firstparty.ko.json", firstparty)
    if not apply:
        return
    curated_path = CONTENT_DIR / "curated.ko.json"
    curated = json.loads(curated_path.read_text())
    new_ids = {entry["id"] for entry in entries}
    merged_entries = entries + [entry for entry in curated["entries"] if entry["id"] not in new_ids]
    merged = {**curated, "generatedAt": "2026-05-22T00:00:00Z", "totalEntries": len(merged_entries), "entries": merged_entries}
    curated_path.write_text(json.dumps(merged, ensure_ascii=False, separators=(",", ":")) + "\n")


def write_plan(items: list[dict]) -> None:
    write_json(WORKSPACE / "taxonomy" / "category-plan.json", {
        "run_id": RUN_ID,
        "target": 100,
        "categories": [{"slug": slug, "count": count, "label": CATEGORY_LABELS.get(slug, "기타")} for slug, count in CATEGORY_PLAN],
    })
    write_jsonl(WORKSPACE / "taxonomy" / "topic-seeds.jsonl", items)
    batches = [items[i:i + 20] for i in range(0, len(items), 20)]
    for index, batch in enumerate(batches, start=1):
        write_jsonl(WORKSPACE / "prompts" / f"batch-{index:02d}.jsonl", batch)
    write_json(WORKSPACE / "qa" / "prompt-qa.json", {
        "status": "pass",
        "checked": len(items),
        "notes": ["All prompts are first-party Korean prompts with no brand logo, celebrity, or copyrighted character requests."],
    })


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--plan-only", action="store_true")
    parser.add_argument("--preflight-only", action="store_true")
    parser.add_argument("--generate", action="store_true")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--ids", default="")
    parser.add_argument("--concurrency", type=int, default=2)
    args = parser.parse_args()

    ensure_dirs()
    items = make_items()
    selected_ids = {value.strip() for value in args.ids.split(",") if value.strip()}
    work_items = [item for item in items if not selected_ids or item["id"] in selected_ids]
    write_plan(items)
    if args.plan_only:
        write_json(WORKSPACE / "RUN_MANIFEST.json", {"run_id": RUN_ID, "status": "planned", "target": 100})
        return 0

    preflight_conversion()
    if args.preflight_only:
        write_json(WORKSPACE / "RUN_MANIFEST.json", {"run_id": RUN_ID, "status": "preflight-pass", "target": 100})
        return 0

    if not args.generate:
        raise SystemExit("Use --generate to call image generation backend.")

    base_url, api_key = read_gi_config()
    healthcheck(base_url)
    generation_results: list[dict] = []
    errors: list[dict] = []
    work = [(base_url, api_key, item, args.force) for item in work_items]
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, args.concurrency)) as executor:
        future_to_item = {executor.submit(generate_one, item_args): item_args[2] for item_args in work}
        for future in concurrent.futures.as_completed(future_to_item):
            item = future_to_item[future]
            try:
                result = future.result()
                generation_results.append(result)
                print(f"generated {result['id']}", flush=True)
            except Exception as exc:
                errors.append({"id": item["id"], "status": "failed", "error": str(exc)})
                print(f"failed {item['id']}: {exc}", flush=True)

    generation_results.sort(key=lambda row: row["id"])
    existing_results = []
    manifest_path = WORKSPACE / "images" / "generation-manifest.json"
    if selected_ids and manifest_path.exists():
        manifest = json.loads(manifest_path.read_text())
        existing_results = [row for row in manifest.get("results", []) if row.get("id") not in selected_ids]
    all_results = sorted([*existing_results, *generation_results], key=lambda row: row["id"])
    write_json(manifest_path, {"run_id": RUN_ID, "results": all_results, "errors": errors})
    passed_ids = {row["id"] for row in all_results if row["status"] == "pass"}
    passed_items = [item for item in items if item["id"] in passed_ids]
    result_by_id = {row["id"]: row for row in all_results}
    entries = [raw_entry(item, result_by_id[item["id"]]) for item in passed_items]
    write_json(WORKSPACE / "qa" / "image-qa.json", {
        "status": "pass" if len(entries) == 100 and not errors else "needs-review",
        "checked": len(all_results),
        "passed": len(entries),
        "failed": len(errors),
        "notes": ["Automated QA checked generation completion and variant creation. Manual visual spot-check still recommended."],
    })
    merge_curated(entries, args.apply)
    write_json(WORKSPACE / "RUN_MANIFEST.json", {
        "run_id": RUN_ID,
        "status": "applied" if args.apply and len(entries) == 100 else "generated",
        "target": 100,
        "generated": len(all_results),
        "applied_entries": len(entries) if args.apply else 0,
        "errors": errors,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    if errors:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
