# E2E stability, persistence & cleanup audit

**Date:** 2026-03-19  
**Scope:** React + Vite + TS frontend, FastAPI backend (code review + automated checks).  
**Method:** Static flow tracing, persistence review, `tsc` + production `npm run build`, targeted lint sample, `python -m compileall` on backend `app/`.  
**Note:** Full browser E2E was **not** executed in this pass (no live API + credentials in CI here). Use this as a QA checklist.

---

## 1. E2E flow findings (code-level)

| Step | Flow | Requests / state | Risk notes | Blocker fix in this pass |
|------|------|------------------|------------|---------------------------|
| 1–2 | Register / Login | `POST` auth, tokens in `localStorage` via `tokenStorage` | Token keys must match axios interceptors | None |
| 3 | `/auth/me` | `fetchMe()` used by `ProtectedRoute`, `Dashboard`, `useAuth` | Duplicate verification paths are intentional | None |
| 4–5 | Dashboard load | `GET /tasks`, `GET` progress summary, local demo fallback | If `/tasks` empty, demo tasks + per-user `localStorage` | None |
| 6–7 | Complete task | `PATCH /tasks/:id` for numeric ids; library `lib:` uses session state + progress optimistic update | Library completions are **session-only** (by design) | Documented |
| 8 | Defer | `deferredUntilDateKey` on real tasks; library defer in `libSchedule` | Persisted for real tasks in `localStorage` keyed by user | None |
| 9 | Weekly strip | `selectedDayIndex` local React state | **Not persisted** across refresh | Intentional unless product asks |
| 10–11 | Categories / detail | React Router, `CategoryDetailPage` + API tasks by `room_id` | Unlinked category: tasks empty but fixed YouTube + library still shown | None |
| 12 | Content hub | Route **`/content-hub` → redirect `/`** | Product removed shell tab; direct URL does not show hub | **Expected:** restore route if hub required again |
| 13–14 | Emotional / journal | `/categories/emotional` → redirect `/categories`; `/emotional-journal` → `/categories` | Journal UI not reachable via current routes | **Expected:** restore routes if journal required |
| 15 | Vision board | Modal in `AppLayout`, API per product | Verify API separately | Not traced to failure |
| 16 | Progress card | `useQuery` + `tasksForCategoryProgress` merge (incl. library completions) | Refetch can lag; optimistic patch used for numeric tasks | Previously fixed in code |
| 17–18 | Logout / re-login | `clearTokens` + **full page** `location.assign(LOGIN)` | Full reload clears in-memory React Query cache | Good for isolation |
| 19–20 | Persistence | Server tasks + `dashboard_demo_tasks_${userId}` | Legacy key `tasks` migrated once per user | None |

**Real blockers:** none identified from static analysis for the **current** product shape (redirects for hub/journal are intentional from recent UX changes).

---

## 2. Data persistence audit

| Area | Mechanism | Isolation | Notes |
|------|-----------|-----------|--------|
| Auth session | `localStorage` tokens | Per browser profile | Logout clears tokens + hard navigation |
| Completed tasks (API) | Backend DB via `PATCH` | Per user | Dashboard hydrates from `GET /tasks` when non-empty |
| Demo / hybrid tasks | `dashboard_demo_tasks_${userId}` | Per numeric user id | Avoids sharing demo lists between users |
| Deferred tasks | `deferredUntilDateKey` on task rows | Persisted in same JSON blob | Stripped when week rolls per `stripExpiredTaskDeferrals` |
| Library refill / complete | `libSchedule` React state | Session only | Resets on refresh — **by design** |
| Progress summary | React Query `["progress","summary","week", sessionUserId]` | Key includes user id | Full page logout clears memory |
| Selected day | `useState` | No persistence | Optional future improvement |

**Stale cache / leakage:** Logout uses full page load → low risk of React Query cross-user bleed. If login ever switches to SPA-only without reload, consider `queryClient.clear()` on successful login of a **different** user.

---

## 3. Cleanup performed (this pass)

| Change | File(s) |
|--------|---------|
| Route noisy `console.log` in auth + dashboard no-token path through **`smokeDebug`** (DEV-only) | `src/hooks/useAuth.ts`, `src/pages/Dashboard.tsx` |
| ESLint: Cypress files use **`cypress/tsconfig.json`** for typed linting | `.eslintrc.cjs` |

**Not removed (risky / out of scope):**  
`EmotionalJournalPage.tsx`, `ContentHubPage.tsx` (pages exist; routes redirect), legacy room routes, large i18n namespaces.

---

## 4. Build / type safety

| Check | Result |
|--------|--------|
| `npx tsc --noEmit` (frontend) | Pass |
| `npm run build` (frontend: `tsc && vite build` + critical CSS) | Pass |
| `python -m compileall app` (backend) | Pass |
| `npm run lint` | **Fails** — pre-existing large warning/error debt (see §7) |

---

## 5. Feature validation (static)

- **Categories hover menu:** `CategoriesNavTab` + `AppLayout.css` bridge — present.  
- **Category routing:** `/categories/:categoryKey` + emotional redirect — present.  
- **Dashboard refill / progress:** `dashboardTaskLibraryRefill`, `tasksForCategoryProgress` — present.  
- **Defer:** Implemented for library + real tasks — present.  
- **Vision board:** Modal in shell — present.  
- **i18n / RTL:** `i18n` + `dir` attributes on key pages — present.  
- **Content hub / emotional journal:** **Not primary routes**; redirects active — align QA with product intent.

---

## 6. UX / quality notes

- **Selected weekday** resets on refresh — document for users or persist if required.  
- **Library task completions** do not survive refresh — expected; optional future persistence.  
- **Content hub & journal** hidden from nav — deep links redirect; update marketing/bookmarks.

---

## 7. Remaining technical debt (intentional)

1. **ESLint:** ~990 issues (`--max-warnings 0` fails). Cypress project wiring reduced some parser errors; remaining: `vite-env.d.ts`, `pwa.ts`, widespread `no-console` / `any` / import-order **warnings** promoted to failure by policy.  
2. **Dead code:** Many legacy pages/components may be unused — need **import graph** or `knip` before mass delete.  
3. **useAuth `user` type** still `any` — gradual typing improvement.  
4. **Duplicate auth fetch:** `ProtectedRoute` + `Dashboard` both call `fetchMe` — acceptable; could dedupe later.

---

## 8. Verdict

| Question | Answer |
|----------|--------|
| Stable enough for next phase? | **Yes for core loop** (auth → dashboard → tasks → progress → categories) **if** product accepts redirected hub/journal and session-only library completions. |
| Manual QA still needed? | **Yes:** register/login against real API, complete/defer on device + mobile swipe, vision board save/load, inventory, shopping, calendar/vision tab, RTL, and **confirm** hub/journal redirect behavior matches stakeholder intent. |

---

## 9. Files touched in this audit pass

- `frontend/.eslintrc.cjs`  
- `frontend/src/hooks/useAuth.ts`  
- `frontend/src/pages/Dashboard.tsx`  
- `frontend/docs/E2E-STABILITY-AUDIT.md` (this file)

**Files removed:** none.
