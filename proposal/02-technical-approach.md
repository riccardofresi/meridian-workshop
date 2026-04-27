# Technical Approach

**RFP:** MC-2026-0417 — Inventory Dashboard Modernization
**Section:** §4.2 Technical Approach

---

This section describes how we will address each item in §3 of the RFP. We treat the four required items as a connected system rather than four parallel tracks: R4 (architecture documentation) precedes the others because it is genuinely useful to do; R1 (Reports remediation) and R3 (testing) reinforce each other because tests written during remediation become regression coverage; R2 (Restocking) is sequenced after R3's framework is in place so the new feature ships with coverage from day one.

---

## R1 — Reports Module Remediation

**Goal.** Resolve the defects in the existing Reports page so Meridian's operations team can rely on what it shows.

**Approach.**

1. **Triage the known issues.** The previous vendor's handoff and Meridian's own logs identify at least eight defects spanning filter behavior, internationalization gaps, console noise, and inconsistent data patterns. We start by reproducing each in the running application, classifying it (UI / API / data / i18n), and confirming severity with operations.
2. **Audit for latent defects.** A focused review of the Reports page and its API surface (`/api/reports/*`) — code path tracing, manual test of edge cases (empty filters, cross-warehouse, partial periods), comparison to the patterns used in adjacent views (Inventory, Orders) which the previous vendor considered done. Findings logged before any fix is written.
3. **Remediate in priority order.** Operations-blocking defects first, cosmetic last. Each fix is paired with a Playwright test (see R3) that asserts the corrected behavior — the test is the regression contract.
4. **Definition of Done shared with the client.** We will confirm with procurement whether DoD covers only the eight logged issues or also includes findings from our audit (see clarifying questions document). Both are workable; the answer changes the fixed-fee.

**Deliverables.** Remediated Reports module; defect log with disposition; regression tests in the R3 suite.

**Risks.** If audit findings exceed the logged eight by a wide margin, we propose either (a) descoping the lowest-severity items to a follow-on phase, or (b) converting R1 to T&M for the residual. We will flag this within the first week of Phase 1, not at the end.

---

## R2 — Restocking Recommendations

**Goal.** A new view that recommends purchase orders given current stock levels, demand forecast, and an operator-supplied budget ceiling.

**Approach.** R2 is the only requirement we propose to deliver under T&M with a not-to-exceed cap. The reason is honest: a recommendation engine that real buyers will use is a product question, not a code question. The risk of over-engineering or under-engineering it is high, and the cost of getting it wrong is borne by R. Tanaka's team, not by us.

We propose three stages:

| Stage | Activity | Output |
|---|---|---|
| **Discovery** (week 4) | Working sessions with VP Operations and 2–3 buyers. Walk through how purchasing actually happens today. Capture the heuristics they already use mentally | Decision document: what the recommendation should optimize for, what inputs are authoritative, what the operator can override |
| **Build** (weeks 5–6) | Backend recommendation endpoint + Vue view. Iterative: weekly demo to operations, course correction in the next sprint | Working Restocking view behind a feature flag |
| **Validate** (week 7) | One review session with operations on a sample of SKUs: the tool generates recommendations, the team flags where it agrees, disagrees, or surfaces something they would not have caught. Adjust | Production-ready feature, validated against real judgment without doubling the team's workload |

**Recommendation logic — initial hypothesis (to be confirmed in Discovery).** Our starting frame is the **(s, S) continuous-review policy** combined with a **newsvendor-style stocking decision** under demand uncertainty — the standard formulation in inventory theory for the trade-off between holding cost and stockout cost (Silver, Pyke & Thomas, *Inventory and Production Management in Supply Chains*, 4th ed.; the newsvendor model itself dates to Arrow, Harris & Marschak, 1951). Concretely, for each SKU we compute a reorder point `s = μ_LT + z·σ_LT` (expected lead-time demand plus a service-level safety stock) and an order-up-to level `S` from the demand forecast and a target service level. Candidates whose inventory position falls below `s` are ranked by criticality (a function of forecast demand, unit margin, and stockout cost), filtered by supplier minimum-order quantities and lead time, then summed greedily against the operator's budget ceiling. The operator can override at any step. We expect the specific ranking and service-level parameters to evolve in Discovery — the framework is academically grounded; the calibration is Meridian-specific.

*Selected references.* Silver, E.A., Pyke, D.F., & Thomas, D.J. (2017). [*Inventory and Production Management in Supply Chains*, 4th ed.](https://books.google.com/books/about/Inventory_and_Production_Management_in_S.html?id=uY2ODwAAQBAJ) CRC Press. — covers (s,S) policies, EOQ, and stochastic demand frameworks. Khouja, M. (1999). [The single-period (news-vendor) problem: literature review and suggestions for future research.](https://digitalcommons.uri.edu/cgi/viewcontent.cgi?article=1031&context=cba_facpubs) *Omega*, 27(5), 537–553. — survey of newsvendor extensions relevant to budget-constrained ordering.

**Deliverables.** Working Restocking view; backend endpoint with documented contract; user guide for operations.

**Risks.** Tanaka's team may have heuristics that resist algorithmic capture (supplier relationships, seasonal judgments). We treat the tool as augmentation, not replacement — operator override is a first-class feature, not an afterthought.

---

## R3 — Automated Browser Testing

**Goal.** End-to-end test coverage on Meridian's critical user flows, sufficient to give IT confidence to approve future changes.

**Approach.** We use **Playwright** — already configured as an MCP server in this repository, signaling that the previous vendor (or Meridian) intended to adopt it. We pick up that intent and operationalize it.

The RFP does not specify which flows count as "critical." We propose the following baseline, derived from the navigation structure and the operational role of each view. We expect to refine this with IT in week 1.

| # | Flow | Why critical |
|---|---|---|
| 1 | Login & navigation across all views | Smoke test — if this breaks, nothing else matters |
| 2 | Inventory filtering across warehouses and categories | Most-used daily operation |
| 3 | Order drill-down with filter combinations | Complex filter state — common defect surface |
| 4 | Reports — quarterly view with all filters applied | Direct overlap with R1; doubles as regression |
| 5 | Demand forecast view rendering and trend display | Tanaka's team checks this before purchase decisions |
| 6 | Backlog view with PO status tracking | High-stakes for fulfillment |
| 7 | Spending — summary, monthly, and category views with filter consistency | Financial accuracy underpins every purchasing decision; defects here erode trust in the dashboard at large |
| 8 | Restocking flow end-to-end (added in Phase 2) | New surface area from R2 |

**Approach to test design.** Page-object pattern, fixtures for warehouse and category data, deterministic assertions (no sleep-and-hope). Tests run against a local instance of the application; they are not infrastructure tests.

**Deliverables.** Playwright test suite (target 7 flows above); CI configuration template; short README for IT explaining how to run the suite locally and what each test asserts.

**Risks.** The application currently runs on mocked JSON data. Tests written against mock data will pass against mock data — they may or may not pass against a production database, if one exists. We have flagged this as a clarifying question; the answer affects the value of R3.

---

## R4 — Architecture Documentation

**Goal.** A current-state architecture overview suitable for handoff to Meridian IT.

**Approach.** We treat R4 as a **prerequisite of onboarding**, not a deliverable shipped at the end. Reading the previous vendor's handoff notes (50 lines of bullet points) confirmed what the RFP itself implies: the existing documentation is insufficient for IT to operate or extend the system. Our first week is spent producing the documentation we ourselves need, and that becomes Meridian's deliverable.

**Contents.**

- **System overview** — components (Vue 3 frontend, FastAPI backend, JSON data layer), ports, deployment topology
- **Data flow diagram** — request lifecycle from Vue component through Axios client through FastAPI endpoint to data source and back
- **API reference** — endpoint inventory with parameters, response shapes, and intended behavior
- **Frontend patterns** — composables (`useAuth`, `useFilters`, `useI18n`), routing, state management approach
- **Known technical debt** — explicit catalog (Options API holdouts, missing test coverage at handoff, mock data layer)
- **Lightweight ADRs** — one per consequential decision we make during the engagement (test framework choice, recommendation logic, deployment model)

**Format.** HTML rendered from Markdown sources, single-page-app friendly so IT can host it internally without tooling.

**Deliverables.** `proposal/architecture.html` (during Phase 1); kept current as Phase 2/3 changes land.

---

## D1 — UI Modernization (desired)

**Approach.** Co-design with R. Tanaka and 2–3 operations representatives before any code. The RFP says "current standards" without defining them; we read this as an invitation to align with how Meridian's team actually wants to work, not to impose an external design system.

**Process.** A 90-minute design session: review the current dashboard, identify the visual and interaction friction points, agree on a refresh palette (likely an evolution of the existing slate/gray tokens, not a replacement). One round of mockups, one round of feedback, then implementation.

**Scope guardrail.** Refresh, not rewrite. We are not migrating to Material 3 or Tailwind UI unless Meridian explicitly requests it as a separate engagement.

---

## D2 — Internationalization (desired)

**Approach.** The application already has an i18n infrastructure (`client/src/locales/en.js`, `ja.js`) and a `useI18n` composable. The work is extension, not foundation: identify untranslated strings across all views, complete the Japanese locale, and verify rendering in the Tokyo team's actual browsers and screen sizes.

**Open question.** The RFP names Tokyo as the driver but does not specify whether other languages are anticipated. We have included this in the clarifying questions; if other locales are planned, the work scales linearly.

---

## D3 — Dark Mode (desired)

**Approach.** Operator-selectable theme via CSS custom properties — the existing token system supports this naturally. Persistence via `localStorage`; no server-side state. Targeting low-light warehouse stations, so contrast and legibility are the priorities, not aesthetics.

**Implementation note.** This is a clean candidate for a feature branch / worktree workflow — it can be developed in isolation and merged once Meridian's team has signed off on the visual outcome. No interaction with R1–R3.

---

## Cross-cutting Assumptions

| # | Assumption | Source |
|---|---|---|
| A1 | Pricing is hybrid: fixed-fee on R1+R3+R4, T&M with not-to-exceed on R2 | Stated in Executive Summary §Commercial model |
| A2 | "Critical user flows" for R3 are the 7 listed above, refined with IT in week 1 | Our proposal in absence of RFP specification |
| A3 | UI modernization (D1) is co-designed with operations, not imposed top-down | Stakeholder context — Tanaka is the user and the champion |
| A4 | Hosting and deployment are handled by Meridian IT; we provide one-time deploy assistance and runbook | RFP says "internally hosted"; ownership inferred |
| A5 | Production data layer is the JSON files visible in the codebase, OR a database we have not yet seen — answer pending | Clarifying question to procurement |

## Risks Identified

| # | Risk | Mitigation |
|---|---|---|
| 1 | Audit of R1 surfaces materially more defects than the eight logged | Flagged in week 1; either descope or convert residual to T&M |
| 2 | R2 recommendation logic resists algorithmic capture | Operator override as first-class feature; iterative demos to operations |
| 3 | Production data layer differs from dev (DB vs JSON) | Clarifying question pending; if confirmed, R3 tests parameterized for both |
| 4 | Latent Options API → Composition API migration debt | Out of scope; surfaced in R4; Meridian decides on follow-on phase |
| 5 | Procurement does not respond to clarifying questions before May 8 | Each ambiguity resolved with explicit assumption; proposal stands without answers |

---

## Engagement Posture

- **Transparency.** Findings surfaced as we have them, not at milestone reviews.
- **Operations as collaborator.** Tanaka and her team co-author R2 and D1; their time is planned, not consumed.
- **IT as customer.** R3 and R4 are written to be operated by Meridian IT after handoff.
