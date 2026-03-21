/**
 * Maps each locale JSON root into i18next namespaces (single file per language).
 *
 * Domain split (no monolithic `ui`):
 * - layout — shell: nav labels, brand strip, focus timer
 * - room — single room detail page
 * - visionBoard — vision board modal
 * - settingsUi — settings screen strings that lived under ui.settingsPage
 * - rooms.hub — Rooms list / map / create (merged from ui.roomsPage)
 *
 * Legacy: if `raw.ui` still exists (older locale files), we derive the above from it
 * until all JSON is migrated to top-level keys only.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bundleLocale(raw: any) {
  const ui = raw.ui ?? {};

  const layout = raw.layout ?? ui.layout ?? {};
  const room = raw.room ?? ui.roomPage ?? {};
  const visionBoard = raw.visionBoard ?? ui.visionBoard ?? {};
  const settingsUi = raw.settingsUi ?? ui.settingsPage ?? {};

  const roomsBase = raw.rooms ?? {};
  const hubFromUi = ui.roomsPage ?? {};
  const hub = { ...(roomsBase.hub ?? {}), ...hubFromUi };
  const rooms =
    raw.rooms != null
      ? Object.keys(hub).length > 0
        ? { ...roomsBase, hub }
        : roomsBase
      : raw.rooms;

  return {
    common: raw.common,
    nav: raw.nav,
    a11y: raw.a11y,
    validation: raw.validation,
    dates: raw.dates,
    pwa: raw.pwa,
    rooms,
    tasks: raw.tasks,
    todos: raw.todos,
    categories: raw.categories,
    auth: raw.auth,
    settings: raw.settings,
    calendar: raw.calendar,
    toast: raw.toast,
    ml: raw.ml,
    privacy: raw.privacy,
    layout,
    room,
    visionBoard,
    settingsUi,
    dashboard: raw.dashboard ?? {},
    productCategories: raw.productCategories ?? {},
    emotionalJournal: raw.emotionalJournal ?? {},
    challenge: raw.challenge ?? {},
    emptyStates: raw.emptyStates ?? {},
    errors: raw.errors ?? {},
    home: raw.home ?? {},
  };
}
