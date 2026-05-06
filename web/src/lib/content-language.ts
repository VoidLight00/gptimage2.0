export type DisplayLanguage = "ko" | "en";

const HANGUL_REGEX = /[가-힣]/;

export function hasHangul(value?: string | null) {
  return HANGUL_REGEX.test(value ?? "");
}

export function inferDisplayLanguage({
  source,
  language,
  title,
  promptBody,
}: {
  source?: string;
  language?: string;
  title?: string | null;
  promptBody?: string | null;
}): DisplayLanguage {
  if ((source ?? "voidlight") === "voidlight") {
    return language === "ko" ? "ko" : "en";
  }

  if (hasHangul(promptBody) || hasHangul(title)) {
    return "ko";
  }

  return language === "ko" ? "ko" : "en";
}
