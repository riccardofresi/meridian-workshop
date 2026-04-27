# Pricing

**RFP:** MC-2026-0417 — Inventory Dashboard Modernization
**Section:** §4.5 Pricing

All figures in **EUR**, based on a single all-inclusive day rate of **€660 / person-day**. Effort estimates (person-days) are derived from the technical approach in §02.

---

## Commercial Model

A **hybrid structure**, designed to align cost with the level of certainty in each track:

- **Fixed-fee** on tracks where scope is bounded by an existing artefact: R1 (defect remediation against a known module), R3 (test coverage against a defined flow list), R4 (architecture documentation of an existing system).
- **Time-and-materials with a not-to-exceed cap** on R2, where scope is intrinsically discovery-driven (the recommendation logic is shaped during Phase 2 with operations).
- **Optional change requests** for desired items (D1–D3), each priced as a standalone increment so Meridian retains full control over what is included.

This model prices what is honestly predictable as fixed, and caps what is honestly uncertain. It avoids the failure mode — committing to a fully-fixed price on a feature whose shape is not yet defined — that contributed to the previous engagement falling short.

---

## Required Items — Fixed-Fee

| Track | Effort (person-days) | Fee |
|---|:-:|:-:|
| **R1 — Reports module remediation** | 12 | €7.920 |
| **R3 — Automated browser testing (8 critical flows + framework)** | 18 | €11.880 |
| **R4 — Architecture documentation** | 8 | €5.280 |
| Engagement management & QA (allocated across required scope) | 6 | €3.960 |
| **Subtotal — Fixed-fee** | **44** | **€29.040** |

**Inclusions in the fixed-fee:**
- All technical work described in §02 for R1, R3, R4
- Weekly written status updates and milestone reviews (M1, M2, M3)
- One round of revisions on each deliverable before milestone acceptance
- Knowledge transfer materials produced as part of R4

**What triggers a fixed-fee adjustment:**
- R1 audit surfaces materially more defects than the 8 logged at handoff (Risk #1, §02). Trigger: defect count >150% of baseline. Resolution: descope or convert residual to T&M, decided jointly at end of W2.
- Production data layer differs from the dev environment (e.g., a real database not visible in the codebase). Resolution: scoped as an addendum before contracting.

---

## R2 Restocking — Time-and-Materials with Not-to-Exceed

| Component | Estimate |
|---|---|
| Day rate | €660 / person-day |
| Estimated effort | 32 person-days over 4 calendar weeks (W4–W7) |
| Estimated cost (32 × €660) | €21.120 |
| **Not-to-exceed cap (×1.10 contingency)** | **€23.232** |

**How T&M is invoiced:**
- Time logged daily, reported weekly with the status note
- Invoice issued monthly against actual logged hours
- The cap is hard: if work to complete R2 to the agreed Definition of Done would exceed the cap, work pauses and we open a scope conversation with procurement before continuing
- Any unused budget under the cap is **not invoiced** — Meridian pays for time worked, not for the ceiling

**Definition of Done for R2 (joint with operations at end of Discovery, week 4):** the Restocking view is in production, the recommendation logic has been validated against operations' judgement on a sample of SKUs, and the feature is covered by Playwright tests in the R3 suite.

---

## Desired Items — Optional Change Requests

Priced as standalone increments. Meridian can include any combination, all, or none. Selection due at award; can also be deferred and added later.

| Item | Effort | Fee |
|---|:-:|:-:|
| **D1 — UI modernization** (co-design + refresh on existing token system) | 10 person-days | €6.600 |
| **D2 — Internationalization** (Japanese locale completion across all views; assumes Japanese only — see clarifying questions) | 6 person-days | €3.960 |
| **D3 — Dark mode** (operator-selectable theme via existing CSS custom properties) | 4 person-days | €2.640 |
| **Subtotal — Desired (all three)** | **20** | **€13.200** |

If Phase 1 or Phase 2 runs to plan, all three desired items fit within the 10-week timeline at no schedule extension. If a phase runs long, Phase 3 absorbs the slip and one or more desired items move to a follow-on engagement.

---

## Total Engagement — Summary

| Component | Amount |
|---|:-:|
| Required (fixed-fee, R1+R3+R4 + management) | €29.040 |
| Required (T&M not-to-exceed, R2) | up to €23.232 |
| **Required total — not-to-exceed** | **up to €52.272** |
| Desired (D1+D2+D3, optional) | up to €13.200 |
| **Engagement total — maximum exposure (all items)** | **up to €65.472** |

Meridian's worst-case spend, with all items selected, is the bottom-row figure. The actual spend will be lower if R2 completes under cap or if desired items are deselected.

---

## Payment Schedule

Tied to the three milestones for visibility and control:

| Trigger | Fixed-fee invoice | T&M invoice | Cumulative |
|---|---|---|---|
| **Contract signature** | 20% mobilization | — | 20% of fixed-fee |
| **M1 — End of Phase 1** | 30% of fixed-fee | actuals to date | ~50% of fixed-fee + W1–W3 actuals |
| **M2 — End of Phase 2** | 30% of fixed-fee | actuals to date | ~80% of fixed-fee + W1–W7 actuals |
| **M3 — End of Phase 3 (acceptance)** | 20% of fixed-fee | final actuals | 100% |

Desired items invoiced on completion of each item, against the change-request fee.

Payment terms: Net 30 from invoice date.

---

## Explicit Exclusions

The following are **not** included in any of the figures above. Each is available as a separate engagement if Meridian elects.

- **Hosting and infrastructure costs.** Meridian operates the internal environment.
- **Deployment beyond first-launch assistance.** We support the initial deploy as part of W10 knowledge transfer; subsequent releases are managed by Meridian IT.
- **Production database design or migration**, if a database not visible in the dev codebase exists in production.
- **Post-launch support, SLA, or managed service.** Available as a follow-on agreement; not in this RFP scope.
- **Training for warehouse floor staff.** Knowledge transfer covers IT and operations stakeholders; broader user training is a separate scope.
- **License fees for third-party tools** beyond those already in the repo (Playwright is open source; no new paid tooling proposed).

---

## Currency, Validity, and Negotiation

- All figures are quoted in **EUR**. We can issue invoices in USD at the spot rate on each invoice date if Meridian prefers; FX risk in that scenario sits with the buyer.
- Quote validity: **90 days** from the proposal submission date (May 8, 2026), i.e., valid through August 6, 2026.
- We are open to negotiating individual line items and milestone weighting. The hybrid structure itself we hold as the right shape for this engagement; we are happy to discuss alternatives if Meridian prefers, with the trade-offs made explicit.
