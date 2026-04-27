# Timeline

**RFP:** MC-2026-0417 — Inventory Dashboard Modernization
**Section:** §4.4 Timeline

---

We propose a **10-week phased delivery**, structured to give Meridian visible milestones every 3–4 weeks and to surface scope risk early rather than late. Phases are sequential by intent (R4 documentation enables R1; R3 framework enables tested R2) but with deliberate parallelism inside each phase to avoid idle time.

Assumed start: **Monday, May 25, 2026** (two weeks after award, allowing for contracting and onboarding).

## Phase summary

| Phase | Weeks | Theme | Key Deliverables | Milestone |
|---|---|---|---|---|
| **1 — Stabilize & Document** | 1–3 | Restore trust, establish foundation | R4 architecture overview · R1 Reports defects log + initial fixes · R3 Playwright framework + smoke tests | M1: Architecture deliverable accepted; Reports defect inventory shared with operations |
| **2 — Enable & Build** | 4–7 | Build new value with coverage from day one | R2 Restocking (Discovery → Build → Validate) · R3 critical flows coverage (8 flows) · D1 co-design kickoff | M2: Restocking feature validated by operations; full Playwright suite green |
| **3 — Polish & Handoff** | 8–10 | Desired items where in scope, transfer to Meridian | D1 implementation · D2 i18n extension · D3 dark mode · Deploy assist · Knowledge transfer to IT | M3: Production deployment supported; IT signs off on documentation and test suite |

## Gantt — week-by-week

> **Visual version:** open [`timeline-gantt.html`](timeline-gantt.html) in any browser for the rendered Gantt chart. The table below is the same plan in pure-Markdown form for inline reading.

| Track | W1 | W2 | W3 | W4 | W5 | W6 | W7 | W8 | W9 | W10 |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **Phase 1 — Stabilize & Document** | | | | | | | | | | |
| R4 Architecture discovery & draft | ◼ | ◼ |   |   |   |   |   |   |   |   |
| R4 Finalize & publish |   | ◼ |   |   |   |   |   |   |   |   |
| R1 Audit & defect triage |   | ◼ |   |   |   |   |   |   |   |   |
| R1 Remediation (priority defects) |   |   | ◼ |   |   |   |   |   |   |   |
| R3 Playwright framework setup | ◼ |   |   |   |   |   |   |   |   |   |
| R3 Smoke tests |   | ◼ |   |   |   |   |   |   |   |   |
| R3 Baseline coverage |   |   | ◼ |   |   |   |   |   |   |   |
| **→ Milestone M1** |   |   | ◆ |   |   |   |   |   |   |   |
| **Phase 2 — Enable & Build** | | | | | | | | | | |
| R2 Discovery (Tanaka + buyers) |   |   |   | ◼ |   |   |   |   |   |   |
| R2 Build — sprint 1 |   |   |   |   | ◼ |   |   |   |   |   |
| R2 Build — sprint 2 + iteration |   |   |   |   |   | ◼ |   |   |   |   |
| R2 Validate (review session) |   |   |   |   |   |   | ◼ |   |   |   |
| R3 Critical flows 1–4 |   |   |   | ◼ |   |   |   |   |   |   |
| R3 Critical flows 5–6 |   |   |   |   | ◼ |   |   |   |   |   |
| R3 Critical flow 7 |   |   |   |   |   | ◼ |   |   |   |   |
| R3 Restocking flow |   |   |   |   |   |   | ◼ |   |   |   |
| D1 Co-design kickoff |   |   |   | ◼ |   |   |   |   |   |   |
| D1 Mockups review |   |   |   |   |   |   | ◼ |   |   |   |
| **→ Milestone M2** |   |   |   |   |   |   | ◆ |   |   |   |
| **Phase 3 — Polish & Handoff** | | | | | | | | | | |
| D1 Implementation |   |   |   |   |   |   |   | ◼ |   |   |
| D2 i18n extension |   |   |   |   |   |   |   | ◼ | ◼ |   |
| D3 Dark mode (feature branch) |   |   |   |   |   |   |   |   | ◼ |   |
| Deploy assist + runbook |   |   |   |   |   |   |   |   |   | ◼ |
| Knowledge transfer to IT |   |   |   |   |   |   |   |   |   | ◼ |
| **→ Milestone M3** |   |   |   |   |   |   |   |   |   | ◆ |

Legend: ◼ active track in the week · ◆ phase milestone. Calendar dates: W1 = May 25, 2026 → W10 = Jul 31, 2026.

## Milestones

| ID | Description | Acceptance criteria | Visible to |
|---|---|---|---|
| **M1** | End of Phase 1 — foundation in place | Architecture document accepted by IT; Reports defect inventory reviewed and prioritized with operations; Playwright framework runs green on smoke flows | Okafor, IT, Tanaka |
| **M2** | End of Phase 2 — new capability shipped with coverage | Restocking feature validated in review session with operations; Playwright suite covers all 8 critical flows and runs green in CI | Tanaka, IT, Okafor |
| **M3** | End of Phase 3 — engagement closed | D1/D2/D3 (where in scope) deployed to internal environment; IT confirms ability to operate, extend, and re-deploy independently | All stakeholders |

## Buffers and contingency

- **Phase 1 includes 0.5 week of slack** absorbed across the three weeks. If R1 audit surfaces materially more defects than the 8 logged (Risk #1 in §02), we trigger the descope-or-T&M conversation with procurement at the **end of W2** — not at the milestone.
- **Phase 2 includes 0.5 week of slack** in W7 between R2 validation and the close of M2. This is the pressure-release valve for the only T&M track.
- **Phase 3 is the natural buffer for the engagement.** D1/D2/D3 are desired, not required. If Phase 1 or Phase 2 runs long, Phase 3 absorbs without impacting the required scope. If everything runs to plan, Phase 3 ships all three desired items.

## Cadence and communication

- **Weekly status note** (written, ~10 lines) every Friday — what shipped, what's blocked, what's next, what changed. Goes to Okafor, IT lead, and Tanaka.
- **Operations working sessions** in W1 (kickoff), W4 (R2 Discovery), W7 (R2 Validate), W10 (handoff). Booked at the start of the engagement, not improvised.
- **Milestone reviews** at end of W3, W7, W10 — 60 minutes, joint. Acceptance signed at the meeting.

## What is not in this timeline

- **Production database migration** (if production runs on a real DB rather than the JSON files visible in dev — see clarifying question). If this is in scope, Phase 1 extends by 1–2 weeks; we will confirm before contracting.
- **User training beyond IT and operations** (e.g., warehouse floor staff training on dark mode or new UI). Available as a separate engagement if requested.
- **Post-launch support / SLA**. Not in scope of this RFP. Available as a follow-on managed-service agreement.
