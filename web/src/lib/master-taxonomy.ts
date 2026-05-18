export const MASTER_TAXONOMY = [
  {
    slug: "ad-key-visual",
    ko: "광고 키비주얼",
    en: "Ad Key Visual",
    descKo: "브랜드 캠페인, 제품 광고, 옥외 광고용 핵심 비주얼",
    descEn: "Hero visuals for brand campaigns, product ads, and OOH placements",
    priority: 1,
  },
  {
    slug: "poster",
    ko: "포스터",
    en: "Poster",
    descKo: "영화, 공연, 이벤트, 전시를 위한 아트 포스터",
    descEn: "Art posters for films, events, exhibitions, and concerts",
    priority: 2,
  },
  {
    slug: "editorial-fashion",
    ko: "패션·뷰티·라이프",
    en: "Fashion · Beauty · Lifestyle",
    descKo: "패션 화보, 뷰티 캠페인, 라이프스타일 이미지",
    descEn: "Fashion editorials, beauty campaigns, and lifestyle imagery",
    priority: 3,
  },
  {
    slug: "social-card",
    ko: "소셜·릴스",
    en: "Social & Reels",
    descKo: "인스타그램, 릴스, 숏폼 콘텐츠용 비주얼",
    descEn: "Visuals optimized for Instagram, Reels, and short-form content",
    priority: 4,
  },
  {
    slug: "card-news",
    ko: "카드뉴스·CRM",
    en: "Card News & CRM",
    descKo: "정보 전달 카드뉴스와 고객 커뮤니케이션 비주얼",
    descEn: "Informational card news and customer-communication visuals",
    priority: 5,
  },
  {
    slug: "product-detail",
    ko: "제품 디테일·랜딩",
    en: "Product Detail & Landing",
    descKo: "제품 상세 페이지, 랜딩 페이지, E-commerce 비주얼",
    descEn: "Product detail pages, landing pages, and e-commerce visuals",
    priority: 6,
  },
  {
    slug: "infographic",
    ko: "인포그래픽·교육",
    en: "Infographics & Education",
    descKo: "데이터 시각화, 교육 자료, 다이어그램",
    descEn: "Data visualization, educational materials, and diagrams",
    priority: 7,
  },
  {
    slug: "character-avatar",
    ko: "캐릭터·아바타",
    en: "Character & Avatar",
    descKo: "브랜드 캐릭터, 아바타, 마스코트 디자인",
    descEn: "Brand characters, avatars, and mascot designs",
    priority: 8,
  },
  {
    slug: "comic-illustration",
    ko: "만화·일러스트",
    en: "Comic & Illustration",
    descKo: "만화 스타일, 디지털 일러스트레이션, 아트워크",
    descEn: "Comic-style art, digital illustration, and creative artwork",
    priority: 9,
  },
  {
    slug: "game-asset",
    ko: "게임 에셋",
    en: "Game Asset",
    descKo: "게임 캐릭터, 배경, UI 스프라이트 에셋",
    descEn: "Game characters, backgrounds, and UI sprite assets",
    priority: 10,
  },
  {
    slug: "uiux-app",
    ko: "UI/UX·앱·웹",
    en: "UI/UX & App",
    descKo: "앱 인터페이스, 웹 UI, 목업 디자인",
    descEn: "App interfaces, web UI, and product mockup designs",
    priority: 11,
  },
  {
    slug: "other",
    ko: "기타",
    en: "Other",
    descKo: "기타 카테고리에 속하지 않는 실험적 비주얼",
    descEn: "Experimental visuals that don't fit other categories",
    priority: 12,
  },
] as const;

export type MasterSlug = (typeof MASTER_TAXONOMY)[number]["slug"];

export function getMasterLabel(slug: string, lang: "ko" | "en") {
  const item = MASTER_TAXONOMY.find((m) => m.slug === slug);
  return item ? item[lang] : slug;
}

export function getMasterDescription(slug: string, lang: "ko" | "en") {
  const item = MASTER_TAXONOMY.find((m) => m.slug === slug);
  if (!item) return undefined;
  return lang === "ko" ? item.descKo : item.descEn;
}

export function getMasterPriority(slug: string): number {
  const item = MASTER_TAXONOMY.find((m) => m.slug === slug);
  return item ? item.priority : 99;
}

export function getMasterIcon(slug: string) {
  return `/brand/master-icons/${slug}.svg`;
}
