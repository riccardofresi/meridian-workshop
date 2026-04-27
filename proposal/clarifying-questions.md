# Clarifying Questions to Procurement

**To:** procurement@meridiancomponents.example
**From:** [ Firm name ] — Bid team, RFP MC-2026-0417
**Date:** April 27, 2026
**Subject:** Clarifying questions per RFP §6 — submitted ahead of the April 28 deadline

---

Dear J. Okafor,

Following our review of the RFP package (the RFP itself, the Meridian background materials, and the previous vendor's handoff notes), we have **three clarifying questions** whose answers materially affect the precision of our pricing and timeline. We have addressed every other ambiguity in the RFP through explicit assumptions in our proposal, so these are the items where a client-side answer would change the shape of what we submit on May 8.

We have kept the list deliberately short. Where an answer is not available in time, we will proceed with the assumption stated in each question.

---

## Q1 — Definition of Done for R1 (Reports module remediation)

**Question.** Does the scope of "all defects in the existing Reports page" cover (a) only the eight or more defects already logged by Meridian's team, or (b) those plus any additional defects we identify during our own audit in week 1–2?

**Why we are asking.** The RFP enumerates "at least eight" logged issues. Our technical approach (§02 R1) includes a focused audit of the Reports page and its API surface, which will likely surface latent defects not in the existing log. The answer determines whether the fixed-fee covers a closed set or an open set, and triggers different handling if the audit finds materially more than eight.

**What we assume if we do not hear back.** Scope (a) — only the logged defects — with a contractual trigger that converts the residual to T&M if our audit surfaces more than 50% additional defects beyond the logged baseline.

---

## Q2 — Internationalization scope for D2

**Question.** The RFP names the Tokyo team as the driver for D2. Is the i18n extension scoped to **Japanese only**, or does Meridian anticipate additional locales (e.g., German for a future EMEA expansion, Mandarin for APAC growth) within the next 12–18 months?

**Why we are asking.** The existing i18n infrastructure (`client/src/locales/en.js`, `ja.js`) supports incremental locale addition, but the work to complete one locale and the work to architect for many are different in scope and price. If additional locales are anticipated, we would design the translation pipeline and string-extraction process with that future in mind, at modest additional cost; if not, we ship Japanese cleanly and stop.

**What we assume if we do not hear back.** Japanese only. D2 is priced and scoped accordingly. Future locales would be a follow-on engagement.

---

## Q3 — Production data layer

**Question.** The codebase delivered in the RFP package operates against JSON files in `server/data/` loaded via `server/mock_data.py`, with no database. **Is the production system the same — running on these JSON files — or does production use a real database (PostgreSQL, MySQL, MongoDB, or otherwise) that is not visible in the codebase we received?**

**Why we are asking.** This affects three of our deliverables:

- **R3 (browser tests)** — tests written against a mock data layer pass against that mock. If production runs on a database with different consistency, transaction, or concurrency behavior, the tests would need to be parameterized for both environments to provide the regression coverage IT actually needs.
- **R4 (architecture documentation)** — the data-layer section of the architecture overview is materially different depending on the answer.
- **Pricing** — if a production database exists, its design and any migration work is currently flagged as an explicit exclusion in §04. We would scope it as an addendum if Meridian wants it included.

**What we assume if we do not hear back.** The JSON-file data layer in the codebase is the production system. R3, R4, and the pricing all reflect this assumption. Any divergence discovered post-award would be handled as a contract addendum at that time.

---

## Format for response

If convenient, replies inline against each question (Q1, Q2, Q3) are sufficient. We do not require a formal letter.

We will incorporate any answers received by May 5 into the final proposal. Answers received after that date but before the May 8 submission will be reflected in the proposal as best we can; later answers will be addressed during contract negotiation.

Thank you for the time and for a clearly written RFP. We look forward to submitting on May 8.

Sincerely,

[ Bid lead name ]
[ Firm name ]
[ Contact email / phone ]
