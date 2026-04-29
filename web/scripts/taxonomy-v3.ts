export const MASTER = [
  { slug: "ad-key-visual", ko: "광고 키비주얼", en: "Ad Key Visual" },
  { slug: "social-card", ko: "소셜·릴스", en: "Social & Reels" },
  { slug: "card-news", ko: "카드뉴스·CRM", en: "Card News & CRM" },
  { slug: "poster", ko: "포스터", en: "Poster" },
  { slug: "product-detail", ko: "제품 디테일·랜딩", en: "Product Detail & Landing" },
  { slug: "editorial-fashion", ko: "패션·뷰티·라이프", en: "Fashion · Beauty · Lifestyle" },
  { slug: "infographic", ko: "인포그래픽·교육", en: "Infographics & Education" },
  { slug: "comic-illustration", ko: "만화·일러스트", en: "Comic & Illustration" },
  { slug: "character-avatar", ko: "캐릭터·아바타", en: "Character & Avatar" },
  { slug: "game-asset", ko: "게임 에셋", en: "Game Asset" },
  { slug: "uiux-app", ko: "UI/UX·앱·웹", en: "UI/UX & App" },
  { slug: "other", ko: "기타", en: "Other" },
] as const;

export type MasterSlug = (typeof MASTER)[number]["slug"];

type MappingInput = {
  source: "voidlight" | "prompts3" | string;
  raw?: string[];
  title?: string | null;
  promptBody?: string | null;
  section?: string | null;
  purposes?: string[];
};

const MASTER_LOOKUP = Object.fromEntries(MASTER.map((item) => [item.slug, item])) as Record<
  MasterSlug,
  (typeof MASTER)[number]
>;

const PRODUCT_DETAIL_KEYWORDS = [
  "detail",
  "details",
  "detail page",
  "product page",
  "landing",
  "landing page",
  "banner",
  "banner landing",
  "ecommerce",
  "상세페이지",
  "상세 페이지",
  "제품 상세",
  "랜딩",
  "배경 변경",
  "background change",
  "mockup",
  "mock-up",
];

const AD_KEY_VISUAL_KEYWORDS = [
  "광고",
  "ad",
  "campaign",
  "key visual",
  "keyvisual",
  "브랜딩",
  "홍보",
  "promotion",
  "marketing",
  "hero visual",
];

const SOCIAL_KEYWORDS = [
  "reels",
  "릴스",
  "shorts",
  "쇼츠",
  "thumbnail",
  "썸네일",
  "youtube",
  "social media",
  "sns",
  "feed post",
  "인스타",
  "틱톡",
];

const CARD_NEWS_KEYWORDS = [
  "crm",
  "newsletter",
  "email",
  "card news",
  "card-news",
  "카드뉴스",
  "뉴스레터",
  "메일",
];

const POSTER_KEYWORDS = ["poster", "포스터", "flyer", "전단", "cover art", "magazine cover"];

const EDITORIAL_KEYWORDS = [
  "beauty",
  "뷰티",
  "fashion",
  "패션",
  "food",
  "푸드",
  "travel",
  "여행",
  "lifestyle",
  "라이프",
  "editorial",
  "화보",
  "photography",
  "photo",
  "portrait",
];

const INFOGRAPHIC_KEYWORDS = [
  "infographic",
  "인포그래픽",
  "education",
  "educational",
  "교육",
  "diagram",
  "도식",
  "chart",
  "교재",
  "학습",
];

const COMIC_KEYWORDS = [
  "comic",
  "만화",
  "illustration",
  "일러스트",
  "storyboard",
  "웹툰",
  "animation",
  "애니메이션",
  "anime",
  "webtoon",
];

const CHARACTER_KEYWORDS = [
  "character",
  "캐릭터",
  "avatar",
  "아바타",
  "profile",
  "프로필",
  "selfie",
  "셀피",
  "emoji",
  "이모티콘",
  "sticker",
  "스티커",
];

const GAME_KEYWORDS = ["game", "게임", "sprite", "asset", "assets", "rpg"];

const UIUX_KEYWORDS = [
  "ui",
  "ux",
  "app",
  "web",
  "dashboard",
  "saas",
  "landing hero",
  "wireframe",
  "온보딩",
  "앱",
  "웹",
];

function normalizeText(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function hasAny(values: string[], targets: string[]) {
  return values.some((value) => targets.includes(value));
}

function resolveProductMarketing(text: string): MasterSlug {
  if (includesAny(text, PRODUCT_DETAIL_KEYWORDS)) {
    return "product-detail";
  }
  if (includesAny(text, AD_KEY_VISUAL_KEYWORDS)) {
    return "ad-key-visual";
  }
  return "ad-key-visual";
}

function resolveByKeywords(text: string): MasterSlug {
  if (includesAny(text, CARD_NEWS_KEYWORDS)) return "card-news";
  if (includesAny(text, SOCIAL_KEYWORDS)) return "social-card";
  if (includesAny(text, PRODUCT_DETAIL_KEYWORDS)) return "product-detail";
  if (includesAny(text, AD_KEY_VISUAL_KEYWORDS)) return "ad-key-visual";
  if (includesAny(text, POSTER_KEYWORDS)) return "poster";
  if (includesAny(text, EDITORIAL_KEYWORDS)) return "editorial-fashion";
  if (includesAny(text, INFOGRAPHIC_KEYWORDS)) return "infographic";
  if (includesAny(text, COMIC_KEYWORDS)) return "comic-illustration";
  if (includesAny(text, CHARACTER_KEYWORDS)) return "character-avatar";
  if (includesAny(text, GAME_KEYWORDS)) return "game-asset";
  if (includesAny(text, UIUX_KEYWORDS)) return "uiux-app";
  return "other";
}

export function getMasterLabel(slug: MasterSlug, lang: "ko" | "en" = "ko") {
  return MASTER_LOOKUP[slug][lang];
}

export function getMasterMeta(slug: MasterSlug) {
  return MASTER_LOOKUP[slug];
}

export function toMaster(input: MappingInput): MasterSlug {
  const raw = [...(input.raw ?? []), ...(input.purposes ?? []), input.section ?? ""]
    .map((value) => normalizeText(value))
    .filter(Boolean);
  const text = normalizeText([input.title, input.promptBody, ...raw].filter(Boolean).join(" "));

  if (input.source === "voidlight") {
    if (hasAny(raw, ["ad key visual"])) return "ad-key-visual";
    if (hasAny(raw, ["reels thumbnail", "youtube thumbnail", "video"])) return "social-card";
    if (hasAny(raw, ["crm", "crm email", "card news"])) return "card-news";
    if (hasAny(raw, ["poster", "typography"])) return "poster";
    if (hasAny(raw, ["detail page", "banner landing"])) return "product-detail";
    if (hasAny(raw, ["beauty", "fashion", "food", "travel", "editorial", "photography"])) {
      return "editorial-fashion";
    }
    if (hasAny(raw, ["infographics"])) return "infographic";
    if (hasAny(raw, ["webtoon illustration", "animation"])) return "comic-illustration";
    if (hasAny(raw, ["character", "selfie"])) return "character-avatar";
    if (hasAny(raw, ["game"])) return "game-asset";
    if (hasAny(raw, ["uiux", "onboarding"])) return "uiux-app";
    if (hasAny(raw, ["other", "logo", "editing"])) return resolveByKeywords(text);
    return resolveByKeywords(text);
  }

  if (input.source === "prompts3") {
    if (hasAny(raw, ["product marketing"])) return resolveProductMarketing(text);
    if (hasAny(raw, ["social media post", "youtube thumbnail"])) return "social-card";
    if (hasAny(raw, ["poster flyer"])) return "poster";
    if (hasAny(raw, ["ecommerce main image"])) return "product-detail";
    if (hasAny(raw, ["infographic edu visual"])) return "infographic";
    if (hasAny(raw, ["comic storyboard"])) return "comic-illustration";
    if (hasAny(raw, ["profile avatar"])) return "character-avatar";
    if (hasAny(raw, ["game asset"])) return "game-asset";
    if (hasAny(raw, ["app web design"])) return "uiux-app";
    if (hasAny(raw, ["other", "unknown"])) return resolveByKeywords(text);
    return resolveByKeywords(text);
  }

  return resolveByKeywords(text);
}
