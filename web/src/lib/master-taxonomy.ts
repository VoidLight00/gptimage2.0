export const MASTER_TAXONOMY = [
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

export type MasterSlug = (typeof MASTER_TAXONOMY)[number]["slug"];

export function getMasterLabel(slug: string, lang: "ko" | "en") {
  const item = MASTER_TAXONOMY.find((m) => m.slug === slug);
  return item ? item[lang] : slug;
}
