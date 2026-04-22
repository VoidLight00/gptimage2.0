/**
 * 2축 분류 체계
 *   Primary:  Purpose (용도)  — 사용자가 찾는 "어떤 콘텐츠?" 축
 *   Tags:     Domain (업종) + Format (비율) + Auto keywords
 *
 * 한국어 콘텐츠 크리에이터/마케팅 프롬프트에 맞춤.
 */

export type CategoryDef = {
  slug: string;
  label: string;
  description?: string;
  keywords: RegExp[];
  weight?: number;
};

/* ─── PURPOSE (메뉴 구조의 기준) ───────────────────────────────────────── */
export const PURPOSES: CategoryDef[] = [
  {
    slug: "ad-key-visual",
    label: "Ad Key Visual",
    description: "광고 캠페인 키비주얼 · 브랜드 커머셜",
    weight: 10,
    keywords: [
      /광고/,
      /캠페인/,
      /키비주얼/,
      /key\s*visual/i,
      /커머셜/,
      /브랜드\s*(비주얼|이미지)/,
      /프로모션/,
      /런칭\s*(이미지|비주얼|캠페인)/,
    ],
  },
  {
    slug: "reels-thumbnail",
    label: "Reels / Shorts Thumbnail",
    description: "릴스 · 쇼츠 · 틱톡 · 유튜브 썸네일",
    weight: 12,
    keywords: [
      /릴스/,
      /숏폼/,
      /쇼츠/,
      /틱톡/,
      /유튜브/,
      /썸네일/,
      /9:16/,
      /세로형\s*썸네일/,
      /커버\s*이미지/,
    ],
  },
  {
    slug: "crm-email",
    label: "CRM Email",
    description: "CRM · 이메일 · 리텐션 · 리워드",
    weight: 11,
    keywords: [
      /CRM/i,
      /이메일\s*(이미지|히어로|콘텐츠)?/,
      /메일\s*이미지/,
      /재방문/,
      /재구매/,
      /리텐션/,
      /웰컴\s*메일/,
      /리워드/,
      /retention/i,
      /onboarding\s*email/i,
    ],
  },
  {
    slug: "detail-page",
    label: "Detail Page",
    description: "상세 페이지 · 상품 디테일",
    weight: 10,
    keywords: [
      /상세\s*페이지/,
      /상세\s*이미지/,
      /디테일\s*페이지/,
      /detail\s*page/i,
      /상품\s*상세/,
    ],
  },
  {
    slug: "banner-landing",
    label: "Banner / Landing",
    description: "배너 · 히어로 · 랜딩 이미지",
    weight: 9,
    keywords: [
      /배너/,
      /banner/i,
      /히어로\s*이미지/,
      /hero\s*image/i,
      /랜딩/,
      /landing/i,
      /메인\s*비주얼/,
    ],
  },
  {
    slug: "card-news",
    label: "Card News",
    description: "카드뉴스 · 캐러셀 · 인포그래픽",
    weight: 10,
    keywords: [
      /카드뉴스/,
      /캐러셀/,
      /인포그래픽/,
      /인포\s*카드/,
      /정보\s*카드/,
      /카드\s*슬라이드/,
    ],
  },
  {
    slug: "poster",
    label: "Poster",
    description: "포스터 · 핀업 · 키아트",
    weight: 8,
    keywords: [
      /포스터/,
      /핀업/,
      /키아트/,
      /key\s*art/i,
      /poster/i,
    ],
  },
  {
    slug: "selfie",
    label: "Selfie",
    description: "셀피 · 셀카 · OOTD",
    weight: 9,
    keywords: [
      /셀카/,
      /셀피/,
      /selfie/i,
      /OOTD/i,
      /미러\s*셀카/,
    ],
  },
  {
    slug: "webtoon-illustration",
    label: "Webtoon / Illustration",
    description: "웹툰 · 일러스트 · 만화",
    weight: 7,
    keywords: [
      /웹툰/,
      /일러스트/,
      /만화\s*컷/,
      /illustration/i,
      /webtoon/i,
      /캐릭터\s*(설정화|시트|디자인)/,
      /복식\s*설정화/,
      /의상\s*설정화/,
    ],
  },
  {
    slug: "editorial",
    label: "Editorial",
    description: "매거진 · 에디토리얼 · 룩북",
    weight: 6,
    keywords: [
      /매거진/,
      /에디토리얼/,
      /editorial/i,
      /룩북/,
      /lookbook/i,
      /화보/,
    ],
  },
  {
    slug: "product-shot",
    label: "Product Shot",
    description: "제품 클로즈업 · 패키지샷",
    weight: 6,
    keywords: [
      /제품\s*샷/,
      /product\s*shot/i,
      /패키지\s*샷/,
      /용기\s*클로즈업/,
      /제품\s*클로즈업/,
    ],
  },
  {
    slug: "logo",
    label: "Logo",
    description: "로고 · 엠블럼 · 심볼",
    weight: 5,
    keywords: [/로고/, /엠블럼/, /심볼/, /logo/i, /emblem/i],
  },
  {
    slug: "onboarding",
    label: "Onboarding",
    description: "온보딩 · 튜토리얼 · 가이드 카드",
    weight: 5,
    keywords: [/온보딩/, /튜토리얼/, /가이드\s*카드/, /첫\s*사용/, /첫\s*방문/],
  },
];

/* ─── DOMAIN (업종 태그) ───────────────────────────────────────────────── */
export const DOMAINS: CategoryDef[] = [
  {
    slug: "beauty",
    label: "Beauty",
    keywords: [/뷰티/, /스킨케어/, /세럼/, /앰플/, /화장품/, /K-?뷰티/i, /클렌징/, /크림/, /로션/, /마스크팩/],
  },
  {
    slug: "hospitality",
    label: "Hospitality",
    keywords: [/호텔/, /객실/, /리조트/, /펜션/, /스테이/, /게스트하우스/, /레지던스/, /부티크\s*호텔/],
  },
  {
    slug: "travel",
    label: "Travel",
    keywords: [/여행/, /관광/, /투어/, /여행지/, /트립/, /휴양/, /바캉스/],
  },
  {
    slug: "fashion",
    label: "Fashion",
    keywords: [
      /패션/,
      /의상/,
      /아우터/,
      /블레이저/,
      /원피스/,
      /데님/,
      /코트/,
      /스타일링/,
      /코디/,
      /룩북/,
      /스트릿/,
    ],
  },
  {
    slug: "fnb",
    label: "F&B",
    keywords: [
      /카페/,
      /커피/,
      /라떼/,
      /아메리카노/,
      /베이커리/,
      /디저트/,
      /음료/,
      /레스토랑/,
      /식당/,
      /편의점/,
      /집밥/,
      /와인/,
      /맥주/,
      /요리/,
      /빵/,
    ],
  },
  {
    slug: "healthcare",
    label: "Healthcare",
    keywords: [
      /병원/,
      /의료/,
      /재활/,
      /운동/,
      /헬스/,
      /피트니스/,
      /요가/,
      /필라테스/,
      /건강/,
      /통증/,
      /웰니스/,
      /치과/,
      /피부과/,
      /성형/,
      /약국/,
      /한의원/,
    ],
  },
  {
    slug: "education",
    label: "Education",
    keywords: [/강의/, /강좌/, /교육/, /학원/, /튜터/, /클래스/, /온라인\s*강좌/, /러닝/, /learning/i],
  },
  {
    slug: "real-estate",
    label: "Real Estate",
    keywords: [/부동산/, /매물/, /분양/, /아파트/, /빌라/, /오피스텔/, /주거/],
  },
  {
    slug: "finance",
    label: "Finance",
    keywords: [/금융/, /투자/, /적금/, /펀드/, /보험/, /카드\s*혜택/, /리워드\s*적립/, /월급/],
  },
  {
    slug: "digital",
    label: "Digital / App",
    keywords: [/\bapp\b/i, /앱\s/, /플랫폼/, /서비스\s*런칭/, /SaaS/i, /구독\s*서비스/],
  },
  {
    slug: "b2b",
    label: "B2B",
    keywords: [/B2B/i, /솔루션/, /엔터프라이즈/, /기업용/, /오퍼레이션/],
  },
  {
    slug: "commerce",
    label: "Commerce",
    keywords: [/쇼핑몰/, /커머스/, /이커머스/, /유통/, /온라인\s*스토어/],
  },
  {
    slug: "ip-content",
    label: "IP / Content",
    keywords: [/캐릭터/, /웹툰/, /\bIP\b/, /애니메이션/, /콘텐츠\s*IP/],
  },
  {
    slug: "mobility",
    label: "Mobility",
    keywords: [/자동차/, /모빌리티/, /\bEV\b/, /전기차/, /오토바이/],
  },
  {
    slug: "tech",
    label: "Tech / Electronics",
    keywords: [/전자제품/, /가전/, /스마트홈/, /AI\s+트렌드/, /IT\s+트렌드/, /테크/],
  },
  {
    slug: "pet",
    label: "Pet",
    keywords: [/반려동물/, /반려견/, /반려묘/, /\b펫\b/, /강아지/, /고양이/],
  },
];

/* ─── FORMAT (비율 태그) ───────────────────────────────────────────────── */
export const FORMATS: CategoryDef[] = [
  { slug: "ar-9-16", label: "9:16", keywords: [/9:16/, /세로형/] },
  { slug: "ar-4-5", label: "4:5", keywords: [/4:5/, /4\s*:\s*5/] },
  { slug: "ar-3-4", label: "3:4", keywords: [/3:4/, /3\s*:\s*4/] },
  { slug: "ar-1-1", label: "1:1", keywords: [/1:1/, /정사각/, /square/i] },
  { slug: "ar-3-2", label: "3:2", keywords: [/3:2/] },
  { slug: "ar-16-9", label: "16:9", keywords: [/16:9/, /가로형/] },
  { slug: "ar-21-9", label: "21:9", keywords: [/21:9/, /와이드스크린/, /시네마스코프/] },
];

/* ─── Scoring & Classification ─────────────────────────────────────────── */

function scoreAgainst(prompt: string, cats: CategoryDef[]): CategoryDef | null {
  const scores: { cat: CategoryDef; score: number }[] = [];
  for (const c of cats) {
    let hits = 0;
    for (const rx of c.keywords) {
      const flags = rx.flags.includes("g") ? rx.flags : rx.flags + "g";
      const g = new RegExp(rx.source, flags);
      const m = prompt.match(g);
      if (m) hits += m.length;
    }
    if (hits > 0) scores.push({ cat: c, score: hits * 100 + (c.weight ?? 0) });
  }
  scores.sort((a, b) => b.score - a.score);
  return scores[0]?.cat ?? null;
}

function scoreAll(prompt: string, cats: CategoryDef[]): CategoryDef[] {
  const hits: { cat: CategoryDef; score: number }[] = [];
  for (const c of cats) {
    let count = 0;
    for (const rx of c.keywords) {
      const flags = rx.flags.includes("g") ? rx.flags : rx.flags + "g";
      const m = prompt.match(new RegExp(rx.source, flags));
      if (m) count += m.length;
    }
    if (count > 0) hits.push({ cat: c, score: count * 100 + (c.weight ?? 0) });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.map((h) => h.cat);
}

export function classify(prompt: string): {
  category: { slug: string; label: string };
  domains: string[];
  formats: string[];
} {
  const purpose = scoreAgainst(prompt, PURPOSES);
  const domains = scoreAll(prompt, DOMAINS);
  const formats = scoreAll(prompt, FORMATS);
  return {
    category: purpose
      ? { slug: purpose.slug, label: purpose.label }
      : { slug: "other", label: "Other" },
    domains: domains.slice(0, 3).map((d) => d.slug),
    formats: formats.slice(0, 2).map((f) => f.slug),
  };
}

/* ─── Tag extraction ───────────────────────────────────────────────────── */

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
  "프롬프트",
  "이미지를",
  "구성을",
  "느낌이",
  "분위기의",
  "스타일로",
]);

export function extractTags(prompt: string): string[] {
  const tags = new Set<string>();
  const words = (prompt.toLowerCase().match(/[a-z][a-z-]{2,19}/g) || []).filter(
    (w) => !STOP_WORDS_EN.has(w)
  );
  const freq: Record<string, number> = {};
  words.forEach((w) => (freq[w] = (freq[w] || 0) + 1));
  Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([w]) => tags.add(w));

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

/* ─── Label lookups for UI ─────────────────────────────────────────────── */

const DOMAIN_LABEL: Record<string, string> = Object.fromEntries(
  DOMAINS.map((d) => [d.slug, d.label])
);
const FORMAT_LABEL: Record<string, string> = Object.fromEntries(
  FORMATS.map((f) => [f.slug, f.label])
);
const PURPOSE_LABEL: Record<string, string> = Object.fromEntries(
  PURPOSES.map((p) => [p.slug, p.label])
);

export const LABELS = {
  domain: DOMAIN_LABEL,
  format: FORMAT_LABEL,
  purpose: PURPOSE_LABEL,
};
