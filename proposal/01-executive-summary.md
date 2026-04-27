# Executive Summary

**RFP:** MC-2026-0417 — Inventory Dashboard Modernization
**To:** J. Okafor, Director of Procurement, Meridian Components, Inc.
**Date:** April 27, 2026

---

Meridian's operations team has built a real business on top of the current dashboard — three warehouses, a growing APAC footprint, and daily decisions that depend on stock, demand, and supplier data being correct. The system today is functional but unfinished: a Reports module the previous vendor never closed out, a backlog of operator requests, and no automated test coverage, which has left IT unable to confidently approve change. The cost of that gap is not technical — it is operational momentum that has stalled.

We propose to restart that momentum in a deliberate, three-pillar engagement:

| Pillar | Focus | Requirements | Outcome for Meridian |
|---|---|---|---|
| **Stabilize** | Restore trust in what the team sees today | R1 | Reports module audited and remediated — known defects and latent issues |
| **Enable** | Unblock every future change, by us or by Meridian | R3 + R4 | E2E coverage on critical flows + current-state architecture docs IT can rely on |
| **Evolve** | Build new capability with the team, not for them | R2 | Restocking recommendations co-designed with VP Operations and her purchasing workflow |

The desired items (UI modernization, expanded i18n for the Tokyo team, dark mode for low-light warehouse stations) are addressed in the technical approach as a co-designed Phase 3, sized separately so Meridian retains full control over scope.

## Commercial model

A hybrid structure that prices what is predictable and is honest about what is not:

- **Fixed-fee** on R1, R3, R4 — scope is bounded by the existing application and the test coverage we will define
- **Time-and-materials with a not-to-exceed cap** on R2 — discovery-driven by design; capping cost while preserving the room the feature needs to be built well
- **Desired items (D1–D3)** — priced as separate, optional change requests so they never inflate the base bid

This avoids the failure mode — committing to a fully-fixed price on a feature whose shape is not yet defined — that contributed to the previous engagement falling short.

## Delivery posture

- 10-week phased plan with visible milestones at each phase boundary
- Deliverables: working code, tests, and architecture documentation
- One-time deployment assistance to IT as part of knowledge transfer; IT retains ownership thereafter

## What we are not solving here

The previous vendor's handoff flags an incomplete Options API → Composition API migration across some views. We have noted this as latent technical debt — out of scope for this RFP, surfaced explicitly in the R4 architecture deliverable so Meridian can decide whether to address it in a follow-on phase. We will not silently absorb it into the fixed-fee.

---

We have read the RFP, the background materials, and the previous vendor's handoff carefully. The proposal that follows reflects what we believe Meridian actually needs — not just what the document literally asks for. We welcome the conversation the technical approach is meant to start.
