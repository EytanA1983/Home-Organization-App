/** Normalized primary language subtag (e.g. fr-FR → fr). */
export function baseLanguageCode(lang: string | undefined): string {
  return (lang || "he").split("-")[0].toLowerCase();
}

/** BCP 47 locale for `Intl` / `toLocaleDateString` (fr/ar/ru/he/en). */
export function intlLocaleForLang(lang: string | undefined): string {
  const code = baseLanguageCode(lang);
  if (code === "he") return "he-IL";
  if (code === "ar") return "ar-SA";
  if (code === "fr") return "fr-FR";
  if (code === "ru") return "ru-RU";
  return "en-US";
}

/** LTR locales vs RTL (Hebrew, Arabic). */
export function isRtlLang(lang: string | undefined): boolean {
  const code = baseLanguageCode(lang);
  return code === "he" || code === "ar";
}

/** Backend / content endpoints that only accept Hebrew or English. */
export function apiHeOrEn(lang: string | undefined): "he" | "en" {
  const code = baseLanguageCode(lang);
  return code === "he" ? "he" : "en";
}

/** Pick from embedded HE/EN pairs (coach copy, demo tasks) when full i18n keys are not defined. */
export function pickBilingual(lang: string | undefined, pair: { he: string; en: string }): string {
  return apiHeOrEn(lang) === "he" ? pair.he : pair.en;
}
