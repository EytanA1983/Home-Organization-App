/** LTR locales vs RTL (Hebrew, Arabic). */
export function isRtlLang(lang: string | undefined): boolean {
  const code = (lang || "he").split("-")[0].toLowerCase();
  return code === "he" || code === "ar";
}

/** Backend / content endpoints that only accept Hebrew or English. */
export function apiHeOrEn(lang: string | undefined): "he" | "en" {
  const code = (lang || "he").split("-")[0].toLowerCase();
  return code === "he" ? "he" : "en";
}

/** Pick from embedded HE/EN pairs (coach copy, demo tasks) when full i18n keys are not defined. */
export function pickBilingual(lang: string | undefined, pair: { he: string; en: string }): string {
  return apiHeOrEn(lang) === "he" ? pair.he : pair.en;
}
