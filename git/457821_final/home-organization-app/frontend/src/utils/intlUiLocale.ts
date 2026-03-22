/**
 * BCP 47 locale tag for `Intl` / `toLocaleDateString` from the active i18n language.
 * Dashboard week strip + selected-day subtitle use `dashboardWeekFormat.ts` helpers
 * built on this function — avoid duplicating locale switches in components.
 */
export function resolveIntlLocaleTag(lang: string | undefined): string {
  const code = (lang || "en").split("-")[0].toLowerCase();
  switch (code) {
    case "he":
      return "he-IL";
    case "ar":
      return "ar-SA";
    case "ru":
      return "ru-RU";
    case "fr":
      return "fr-FR";
    default:
      return "en-US";
  }
}
