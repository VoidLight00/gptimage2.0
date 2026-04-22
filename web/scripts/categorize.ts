/**
 * 키워드 기반 자동 카테고리 분류.
 * 한국어 AI 이미지 프롬프트(광고·썸네일·카드뉴스 등 콘텐츠 크리에이터 용도)에 최적화.
 * content/overrides.json 이 있으면 id→category 매핑이 우선 적용된다.
 */
export type CategoryDef = {
  slug: string;
  label: string;
  description?: string;
  keywords: RegExp[];
  weight?: number; // 동점일 때의 tiebreaker (높을수록 우선)
};

export const CATEGORIES: CategoryDef[] = [
  {
    slug: "ad",
    label: "AD",
    description: "광고·캠페인·키비주얼",
    weight: 10,
    keywords: [
      /광고/,
      /캠페인/,
      /키비주얼/,
      /브랜드/,
      /런칭/,
      /프로모션/,
      /프리미엄\s*(이미지|비주얼)/,
      /\b(campaign|advertising|commercial|brand\s*visual)\b/i,
    ],
  },
  {
    slug: "thumbnail",
    label: "Thumbnail",
    description: "릴스·숏폼·유튜브 썸네일",
    weight: 11,
    keywords: [
      /썸네일/,
      /릴스/,
      /숏폼/,
      /쇼츠/,
      /유튜브/,
      /틱톡/,
      /커버\s*이미지/,
      /9:16/,
      /세로형/,
      /\b(thumbnail|reels|shorts|youtube|tiktok|cover)\b/i,
    ],
  },
  {
    slug: "cardnews",
    label: "Card News",
    description: "카드뉴스·캐러셀·인포그래픽",
    weight: 11,
    keywords: [
      /카드뉴스/,
      /캐러셀/,
      /인포그래픽/,
      /인포/,
      /정보\s*이미지/,
      /가이드\s*카드/,
      /\b(carousel|infographic|info card)\b/i,
    ],
  },
  {
    slug: "poster",
    label: "Poster",
    description: "포스터·타이포그래피",
    weight: 9,
    keywords: [
      /포스터/,
      /타이포/,
      /매거진/,
      /편집\s*디자인/,
      /에디토리얼/,
      /\b(poster|typography|editorial|magazine|layout)\b/i,
    ],
  },
  {
    slug: "product",
    label: "Product",
    description: "제품·패키지 클로즈업",
    weight: 8,
    keywords: [
      /제품\s*이미지/,
      /패키지/,
      /용기/,
      /세럼/,
      /앰플/,
      /스킨케어/,
      /뷰티/,
      /화장품/,
      /K-?뷰티/i,
      /클렌징/,
      /런칭/,
      /\b(product|packaging|skincare|beauty|bottle|cosmetic)\b/i,
    ],
  },
  {
    slug: "space",
    label: "Space",
    description: "공간·호텔·매장·인테리어",
    weight: 7,
    keywords: [
      /호텔/,
      /객실/,
      /테라스/,
      /로비/,
      /인테리어/,
      /매장/,
      /카페\s*공간/,
      /건축/,
      /공간/,
      /라운지/,
      /레지던스/,
      /부티크/,
      /\b(hotel|interior|architecture|lobby|suite|residence)\b/i,
    ],
  },
  {
    slug: "food",
    label: "Food",
    description: "음식·F&B·카페",
    weight: 7,
    keywords: [
      /음식/,
      /요리/,
      /디저트/,
      /베이커리/,
      /빵/,
      /케이크/,
      /커피/,
      /라떼/,
      /아메리카노/,
      /음료/,
      /맥주/,
      /와인/,
      /식당/,
      /레스토랑/,
      /카페/,
      /편의점/,
      /집밥/,
      /F&B/,
      /\b(food|dish|cuisine|coffee|bakery|beverage|cafe|restaurant)\b/i,
    ],
  },
  {
    slug: "travel",
    label: "Travel",
    description: "여행·관광·로컬",
    weight: 7,
    keywords: [
      /여행/,
      /관광/,
      /제주/,
      /서울/,
      /부산/,
      /해외/,
      /국내여행/,
      /로컬/,
      /액티비티/,
      /투어/,
      /\b(travel|tourism|trip|vacation|getaway)\b/i,
    ],
  },
  {
    slug: "portrait",
    label: "Portrait",
    description: "인물·셀피·모델",
    weight: 6,
    keywords: [
      /인물/,
      /얼굴/,
      /초상/,
      /셀카/,
      /셀피/,
      /모델/,
      /크리에이터/,
      /인플루언서/,
      /\b(portrait|selfie|headshot|influencer|model|woman|man|face)\b/i,
    ],
  },
  {
    slug: "fashion",
    label: "Fashion",
    description: "패션·스타일링·룩북",
    weight: 7,
    keywords: [
      /패션/,
      /의상/,
      /룩북/,
      /스타일링/,
      /코디/,
      /옷/,
      /블레이저/,
      /원피스/,
      /스트릿/,
      /런웨이/,
      /\b(fashion|outfit|styling|lookbook|streetwear|runway)\b/i,
    ],
  },
  {
    slug: "character",
    label: "Character",
    description: "캐릭터·웹툰·일러스트",
    weight: 6,
    keywords: [
      /캐릭터/,
      /웹툰/,
      /만화/,
      /애니/,
      /캐릭\b/,
      /의상\s*설정화/,
      /설정화/,
      /복식\s*디자인/,
      /일러스트/,
      /\b(character|webtoon|comic|anime|illustration|manga)\b/i,
    ],
  },
  {
    slug: "landscape",
    label: "Landscape",
    description: "풍경·자연",
    weight: 5,
    keywords: [
      /풍경/,
      /자연/,
      /산/,
      /바다/,
      /해변/,
      /하늘/,
      /노을/,
      /일출/,
      /\b(landscape|scenery|mountain|ocean|sea|beach|sky|sunset|sunrise)\b/i,
    ],
  },
  {
    slug: "crm",
    label: "CRM",
    description: "이메일·CRM·리텐션",
    weight: 8,
    keywords: [
      /CRM/i,
      /이메일/,
      /메일\s*이미지/,
      /재방문/,
      /재구매/,
      /리텐션/,
      /웰컴/,
      /온보딩/,
      /리워드/,
      /\b(email|crm|onboarding|retention|reward)\b/i,
    ],
  },
  {
    slug: "education",
    label: "Education",
    description: "교육·강의·가이드",
    weight: 6,
    keywords: [
      /강의/,
      /강좌/,
      /교육/,
      /가이드/,
      /튜토리얼/,
      /학습/,
      /\b(tutorial|course|guide|lesson|class|education)\b/i,
    ],
  },
  {
    slug: "health",
    label: "Health",
    description: "건강·운동·웰니스",
    weight: 6,
    keywords: [
      /운동/,
      /재활/,
      /헬스/,
      /피트니스/,
      /요가/,
      /필라테스/,
      /스트레칭/,
      /통증/,
      /웰니스/,
      /건강/,
      /\b(fitness|workout|wellness|yoga|pilates|rehabilitation|stretching)\b/i,
    ],
  },
];

export function classify(prompt: string): { slug: string; label: string } {
  const scores: Record<string, number> = {};
  for (const cat of CATEGORIES) {
    let score = 0;
    for (const rx of cat.keywords) {
      const flags = rx.flags.includes("g") ? rx.flags : rx.flags + "g";
      const globalRx = new RegExp(rx.source, flags);
      const m = prompt.match(globalRx);
      if (m) score += m.length;
    }
    if (score > 0) scores[cat.slug] = score * 100 + (cat.weight ?? 0);
  }
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) {
    return { slug: "etc", label: "Etc" };
  }
  const top = CATEGORIES.find((c) => c.slug === ranked[0][0])!;
  return { slug: top.slug, label: top.label };
}

const STOP_WORDS_EN = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "into",
  "over",
  "style",
  "very",
  "high",
  "image",
  "photo",
  "photograph",
  "create",
  "scene",
  "look",
  "design",
  "shot",
  "background",
]);

const STOP_WORDS_KR = new Set([
  "이미지",
  "스타일",
  "느낌",
  "분위기",
  "구성",
  "화면",
  "장면",
  "콘텐츠",
  "요소",
  "감성",
  "구도",
  "비율",
  "제작",
  "활용",
  "적합",
  "포인트",
  "메시지",
  "브랜드",
  "디자인",
  "컨셉",
]);

export function extractTags(prompt: string): string[] {
  const tags = new Set<string>();

  // 영문 단어 빈도
  const words = (prompt.toLowerCase().match(/[a-z][a-z-]{2,19}/g) || []).filter(
    (w) => !STOP_WORDS_EN.has(w)
  );
  const freq: Record<string, number> = {};
  words.forEach((w) => (freq[w] = (freq[w] || 0) + 1));
  Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .forEach(([w]) => tags.add(w));

  // 한글 2~4자 명사 후보
  const korean = prompt.match(/[가-힣]{2,4}/g) || [];
  const kFreq: Record<string, number> = {};
  korean.forEach((w) => {
    if (!STOP_WORDS_KR.has(w)) kFreq[w] = (kFreq[w] || 0) + 1;
  });
  Object.entries(kFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([w]) => tags.add(w));

  return Array.from(tags).slice(0, 8);
}
