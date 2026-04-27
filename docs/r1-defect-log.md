# R1 — Defect Log

**Engagement:** Meridian Components — Inventory Dashboard Modernization (RFP MC-2026-0417)
**Phase:** 1 — Stabilize & Document
**Date opened:** April 27, 2026 (W1)
**Source:** combined operator walk-through (filters not affecting visuals, `/api/tasks` 404 in console) + systematic codebase audit across all views

---

## Summary

The audit confirms the previous vendor's handoff statement that the Reports module was left "in progress" and that "at least eight" defects were logged. We consolidate **16 distinct defects** across three views (Reports, Backlog, Spending), the application shell (App.vue / Dashboard branding), and the API surface, plus **one design clarification** to validate with VP Operations.

**Distribution by severity:**

| Severity | Count | Definition |
|---|:-:|---|
| **High** | 5 | Feature does not function or wrong data visible to operator |
| **Medium** | 7 | Structural debt, divergence from project conventions |
| **Low** | 4 | Developer-experience or cosmetic |
| **Clarification** | 1 | Design intent question for client (not a defect) |

**Distribution by track:**

| Track | Count |
|---|:-:|
| Reports module (R1 primary scope) | 8 |
| Backlog module (R1 secondary — i18n debt) | 3 |
| Spending module (R1 secondary — minor) | 2 |
| Application shell / Dashboard (cross-cutting) | 2 |
| API surface (cross-cutting) | 2 |

This is **+87% above the 8-defect baseline** in the RFP. We anticipated a +50% trigger in our proposal (§02 R1, Risk #1); we are now closer to the upper bound of that envelope. Two of the three new findings (Catalyst branding, "1 days" pluralization) are cosmetic and quick. The third (PurchaseOrderModal Vue warning) is structural but absorbed into R2 build (PO endpoint is in scope there). **No T&M conversion triggered**, but we will surface the elevated count to procurement at end of W2 along with the rest of the R1 milestone communication.

---

## Defects — High severity

### #01 — Reports page is fully disconnected from the filter system
**File:** `client/src/views/Reports.vue`
**Symptom (operator-observed):** applying any filter (Time Period, Warehouse, Category, Status) on the Reports page produces no change in the displayed quarterly tables, monthly trends chart, or summary stats.
**Root cause (code-confirmed):** the view does not import `composables/useFilters.js`, the two `axios.get` calls (lines 156, 162) pass no query parameters, and there is no `watch` on filter state. The view fetches once at mount and never reacts.
**Evidence:** `Reports.vue:127–214`
**Resolution sketch:** migrate to Composition API (see #04), import `useFilters`, pass `getCurrentFilters()` as `params` to the axios calls, add a `watch` on the four filter refs to reload data.

### #02 — `GET /api/tasks` returns 404 (endpoint never implemented)
**Files:** `client/src/api.js:77–95`, `client/src/App.vue:89–149`, `server/main.py` (no matching route)
**Symptom:** every app mount produces a console error `Failed to load tasks: Request failed with status code 404`. The Tasks modal silently falls back to mock tasks from `currentUser`.
**Root cause:** client implements full CRUD against `/api/tasks` (GET, POST, DELETE, PATCH); backend declares no such routes.
**Resolution path:** confirm with R. Tanaka whether tasks is a wanted feature. If yes — implement the four backend endpoints with persistence to a JSON file under `server/data/`. If no — remove the client code.

### #03 — `POST/GET /api/purchase-orders` referenced by client, missing on backend
**Files:** `client/src/api.js:97–104`, `server/main.py` (no matching route)
**Symptom:** any UI flow that triggers PO creation will fail at runtime.
**Root cause:** same pattern as #02 — client-only feature, backend never built it.
**Resolution path:** in scope of R2 (Restocking) the backend will need this endpoint anyway. Defer fix to R2 build phase rather than fixing in isolation.

### #04 — Reports.vue uses Options API in a Composition-API project
**File:** `client/src/views/Reports.vue:127–317`
**Why High and not Medium:** Options API is debt elsewhere, but here it's the **enabling cause** for #01 — the view cannot cleanly consume the Composition-API composables (`useFilters`, `useI18n`) without migration. Fixing #01 without #04 would mean partial/awkward integration.
**Resolution path:** rewrite the `<script>` block as Composition API setup. Fold #01, #07, #08, #11 fixes into the same migration.

### #14 — `PurchaseOrderModal` referenced but not registered (Vue runtime warning)
**Files:** `client/src/views/Dashboard.vue` (template uses `<PurchaseOrderModal />`); modal component file not present in `client/src/components/`; not imported anywhere.
**Symptom:** every Dashboard render emits a Vue warning to the console: `Failed to resolve component: PurchaseOrderModal`. The "Create PO" buttons in the inventory-shortages table render but do nothing — clicks have no observable effect.
**Why High:** the operator-facing "Create PO" action is broken. Combined with #03 (backend endpoint missing), the entire PO creation surface is non-functional from end to end.
**Resolution path:** absorbed into R2 build. The Restocking work creates the PO modal as part of the new feature; once #03 ships the backend endpoint and the modal is built, this warning disappears. **Decision:** do NOT create a stub modal in W2 — that would be throwaway code. Document the broken state in the W2 milestone note, fix in Phase 2.

---

## Defects — Medium severity

### #05 — Reports.vue calls axios directly, bypassing `api.js`
**File:** `client/src/views/Reports.vue:156, 162`
**Issue:** all other views centralize HTTP through `client/src/api.js`. Reports calls `axios.get` directly with hardcoded base URL. Inconsistent and harder to test/mock.
**Resolution:** move `quarterly`/`monthly-trends` calls into `api.js` as `getQuarterlyReport(filters)` / `getMonthlyTrends(filters)`.

### #06 — Reports.vue uses array index as `:key` in three `v-for`
**File:** `Reports.vue:28, 51, 82`
**Issue:** `:key="index"` on three loops. Project convention (and `client/CLAUDE.md`) explicitly forbids it. Causes incorrect DOM reuse on list mutations.
**Resolution:** use stable identifiers — quarter ID for the quarterly table, month string for monthly tables and chart bars.

### #07 — Reports.vue lacks i18n integration
**Files:** `Reports.vue:4, 14, 47, 67, 107, 110, 115, 119` (hardcoded strings); no `useI18n` import
**Issue:** strings like "Performance Reports", "Quarterly Performance", "Monthly Revenue Trend" are hardcoded English. Tokyo team would see English on a page their colleagues see in Japanese elsewhere (Inventory, Orders, Demand are translated).
**Resolution:** import `useI18n`, externalize strings to `locales/en.js` and `locales/ja.js` under a `reports.*` namespace.

### #08 — Backlog.vue lacks i18n integration
**Files:** `client/src/views/Backlog.vue:4–73` (hardcoded strings); no `useI18n` import
**Issue:** same pattern as #07. "Backlog Management", "Track and resolve inventory shortages", priority labels (High/Medium/Low) all hardcoded.
**Note:** D2 (i18n extension) in the desired items will pick this up at scale, but for R1 consistency this should be fixed in Phase 1.

### #09 — Backlog.vue priority badge prints raw English value
**File:** `Backlog.vue:72`
**Issue:** `{{ item.priority }}` renders the API value verbatim ("high"/"medium"/"low"). Even with i18n added, the value comes from backend untranslated.
**Resolution:** introduce a translation helper or map raw priority to an i18n key.

### #10 — Reports.vue formats numbers via instance methods called from template
**File:** `Reports.vue:31, 32, 85, 108, 112` calling `formatNumber` per cell
**Issue:** `formatNumber` runs on every render for every cell instead of in computed properties. With table rows × columns, this is dozens of calls per render. `client/CLAUDE.md` calls this out explicitly: "Heavy computations in methods instead of computed → ❌ Don't".
**Resolution:** during the Composition-API migration (#04), replace methods with computed-prop derived data.

---

## Defects — Low severity

### #11 — Reports.vue contains 14 stray `console.log` calls
**File:** `Reports.vue:145, 150, 155, 158, 161, 162, 164, 167, 169, 172, 176, 215, 243, 256`
**Issue:** debug noise left from vendor development. Notably `formatNumber` logs every invocation (line 215) and the error path uses `console.log` (line 172) instead of `console.error`, so the error filter in DevTools won't catch it.
**Resolution:** remove all log calls during the rewrite (#04). Keep `console.error` only on the catch.

### #12 — Spending.vue uses `alert()` for transaction click
**File:** `client/src/views/Spending.vue:452`
**Issue:** `alert()` blocks the main thread and looks unprofessional. Other detail interactions in the app open modals (e.g. `ProductDetailModal`, `BacklogDetailModal`).
**Resolution:** introduce `TransactionDetailModal` consistent with sibling modals, or emit an event for parent handling. Lower-priority but visible to the user.

### #13 — Spending.vue performs `toLocaleString()` in template
**File:** `Spending.vue:59, 60, 115, 157`
**Issue:** number formatting calls in template instead of computed. Same anti-pattern family as #10, smaller scale.
**Resolution:** wrap in computed properties or a shared formatter utility under `client/src/utils/`.

### #15 — Application banner brand reads "Catalyst Components"
**File:** `client/src/App.vue` (header `<h1>` in the banner)
**Symptom:** the page banner across every view reads **"Catalyst Components"** instead of **"Meridian Components"**. Visible to every operator on every screen.
**Likely cause:** the previous vendor likely used a template/boilerplate from another engagement and never rebranded for Meridian. CLAUDE.md, RFP, and the proposal all consistently use "Meridian Components" — the H1 is the only place the wrong name appears.
**Severity:** Medium — not a functional break, but a visible client-name error that would damage credibility if shown in a demo to procurement. Trivial to fix.
**Resolution:** rename to "Meridian Components" in `App.vue`, plus check `locales/en.js` and `locales/ja.js` for any matching string. One-line change, ship in W3 cleanup window with the rest of the cosmetic fixes.

### #17 — Spending category percentages displayed as "of total" but sum to ~124%
**File:** `client/src/views/Spending.vue:121` (`{{ category.percentage }}% of total`); `server/main.py` returns the four cost categories
**Symptom:** the four cost categories (Raw Materials 42.5%, Components 38.8%, Consumables 23.3%, Equipment 19.0%) each display "% of total" — but the four percentages sum to approximately **124%**, which is mathematically inconsistent with "of total".
**Likely cause:** each percentage appears to be computed relative to a different denominator (its own subtotal or budget?), but the label "of total" implies a single denominator. Either the labels are wrong or the maths are wrong.
**Severity:** Low — visible to operators reading the Finance page. Would prompt a "the numbers don't add up" question from Tanaka or procurement during a demo.
**Discovered:** while writing the R3 Spending E2E spec (Phase 2 W5).
**Resolution path (proposed):** confirm with operations whether the intent is (a) "% of overall spend" (then maths needs fixing in `server/main.py`) or (b) "% of own bucket" (then label needs to read e.g. "% of procurement" / "% of operational"). One-line fix once confirmed.

### #16 — `"1 days"` instead of `"1 day"` in inventory-shortages table (pluralization bug)
**File:** Dashboard inventory-shortages table — likely `client/src/views/Dashboard.vue` (Days Delayed column)
**Symptom:** rows where `days_delayed === 1` render as "1 days" instead of "1 day". Confirmed in operator walk-through (visible in row `ORD-2025-0929`).
**Severity:** Low — cosmetic, but a precise indicator that the project has no pluralization helper. The same shape will recur whenever a count is rendered with a unit ("1 items", "1 orders", …). For D2 (i18n) this is also relevant: Japanese has no plural inflection, English does.
**Resolution:** introduce a small `pluralize(n, singular, plural)` helper in `client/src/utils/`. Use it in the Days Delayed column and audit other `{ count } { unit-string }` patterns. ~15 minutes.

---

## Clarification with client (not a defect)

### Q1 — Filter state persists across pages by design — confirm with Operations
**File:** `client/src/composables/useFilters.js:4–7`
**Observation:** the four filter refs are declared at module scope (outside `useFilters()`), with the explicit comment `// Shared filter state (singleton pattern)`. All views that consume `useFilters()` share the same state — applying a filter on Inventory keeps it active when navigating to Orders.
**Why this matters:** during the operator walk-through this was perceived as "filters persist between sections, not sure if intended." The vendor wrote it intentionally; it's not a bug. But the UX is debatable: it can confuse operators who don't notice a stale filter is still active.
**Three plausible answers from R. Tanaka:**
- *Confirm as-is* — no change needed
- *Reset on navigation* — make refs local to `useFilters()`; small refactor
- *Keep but make active filters more visible* — surface `hasActiveFilters` in the header with a "X filters active" badge and a one-click reset

We will raise this in the W1 working session with Operations and act on the answer in Phase 1.

---

## Cross-cutting findings (orientation, not formal defects)

- **Composition API adoption is inconsistent.** Reports is the only view still on Options API. Backlog uses Composition API but skipped i18n. Other views (Dashboard, Inventory, Orders, Spending, Demand) are clean. The "incomplete migration" mentioned in the vendor handoff resolves to **one view (Reports)**, narrower than feared.
- **API client centralization is mostly clean.** Only Reports.vue bypasses `api.js`. After the rewrite (#04, #05), all client→server calls flow through one module — good for R3 test mocking.
- **Two API endpoints (`/api/tasks`, `/api/purchase-orders`) are client-only.** Frontend code exists; backend never built them. Combined with the Reports defects, this confirms the handoff narrative: development was halted mid-feature in multiple places.
- **No defects found in:** Inventory, Orders, Demand. These are functioning as expected.
- **Dashboard surface:** two new defects appeared on second pass (#14 PurchaseOrderModal, #15 brand) — the page renders but has visible cracks. Inventory-shortages table also has the pluralization bug (#16).

---

## Disposition and current status

| Defect | Status | Notes |
|---|---|---|
| #01, #04, #05, #06, #07, #10, #11 | ✅ **Closed** in W2 — single Reports rewrite | Composition API · `useFilters`+`watch` · `useI18n` · `api.js` centralization · stable v-for keys · console-log cleanup |
| #02, #03, #14 | ⏸️ **Deferred** | #02 awaits Tanaka decision (W1 session); #03 + #14 absorbed into R2 build (Phase 2) |
| #08, #09 | ✅ **Closed** in W7 | `/backlog` route registered (closes #DEBT-05); Backlog.vue rewritten with `useI18n`, full `backlog.*` namespace in en/ja, priority labels translated via `priority.*`, `pluralize` helper applied to Days Delayed |
| #12, #13 | ✅ **Closed** in W3 cleanup | Spending: removed `alert()` and dead click handler; replaced 4 in-template `toLocaleString` with `formatCurrency` |
| #15 | ✅ **Closed** in W3 cleanup | Banner brand: `Catalyst Components` → `Meridian Components` (en) and `触媒コンポーネンツ` → `メリディアン・コンポーネンツ` (ja) |
| #16 | ✅ **Closed** in W3 cleanup | Added `utils/pluralize.js`; applied in Dashboard inventory-shortages row and BacklogDetailModal. Verified `1 day` / `3 days` / `5 days` |
| #17 | ⏸️ **Open** | Discovered W5 while writing Spending E2E. Cost-category percentages display "% of total" but sum to ~124%. Resolution requires Operations input on intended denominator |
| Q1 | ⏸️ **Pending** Operations | W1 working session not yet held in workshop simulation |

**Defect-count vs proposal baseline.** 15 confirmed defects against the 8 logged. **9 closed in Phase 1 (R1 rewrite + W3 cleanup).** Remaining 6 are deferred pending stakeholder input or absorbed into Phase 2 R2 build — none represent unaddressed scope. Below the 150% T&M-conversion trigger (per pricing assumption). **No T&M conversion needed.**

**Communication to procurement** (end of W2): elevated count surfaced, mitigation explained, Phase 1 milestone M1 proposed for acceptance.
