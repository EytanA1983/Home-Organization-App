# i18n, RTL, and avoiding language “leaks”

## Supported UI languages

`he`, `en`, `ru` have full locale JSON. `fr` and `ar` are built as **English + overrides** (`fr.overrides.json`, `ar.overrides.json`) merged in `src/i18n/config.ts`.

## Direction (`dir`)

- **RTL:** Hebrew (`he`) and Arabic (`ar`) — see `isRtlLang()` in `src/utils/localeDirection.ts`.
- **LTR:** English, French, Russian.

Do **not** infer direction from “not English”. Use `isRtlLang(i18n.language)` (or the document `dir` set in `AppLayout` / `LanguageSwitcher`).

## Intl / dates

Use `intlLocaleForLang(lang)` for `toLocaleDateString` / sorting so French, Arabic, and Russian get correct formatting — not only `he-IL` vs `en-US`.

## API content language

Endpoints that only accept Hebrew or English should use `apiHeOrEn(i18n.language)` (same rule as before). UI copy for `fr`/`ar` still comes from i18n; server text may fall back to English.

## Anti-patterns removed in the codebase

- `isEnglish ? english : hebrew` branches for whole pages (they forced **Hebrew + RTL** for every non-English language).
- Hardcoded bilingual objects in components — replaced with **i18n keys** under `tasks`, `calendar`, `dashboard`, `inventory`, `productCategories.contentSupport`, etc.

## Adding strings for `fr` / `ar`

1. Add keys to `en.json` / `he.json` as needed.
2. Add French/Arabic strings under the same key path in `fr.overrides.json` / `ar.overrides.json`.
3. For Russian, edit `ru.json` like English/Hebrew.

## FullCalendar

`CalendarPage` registers `he`, `fr`, `ar`, `ru` locale data and sets `locale` from `baseLanguageCode(i18n.language)`.
