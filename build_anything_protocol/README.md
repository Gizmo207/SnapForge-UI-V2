# Build Anything Protocol — Applied to SnapForge UI v2

This directory is the SnapForge UI v2 application of the
[Build Anything Protocol](https://github.com/Gizmo207/The-Build-Anything-Protocol)
(BAP v1.0, locked). It captures the product and system thinking for v2 and
answers:

- What are we building?
- Why are we building it?
- What must be true?

It is intentionally framework-agnostic up to phase `10_delivery_and_ops`, where
the concrete v2 stack is recorded.

---

## What SnapForge UI v2 is

A **single-user UI component vault**. The core loop:

> Paste a React or HTML snippet → it is auto-parsed (framework detect, name
> infer, dependency detect, classify into a taxonomy), **sanitized**, and
> **previewed live** in a sandboxed gallery → browse / search → multi-select
> **export** as a zip bundle.

v1 (the Vite SPA + Express + Postgres + custom parser/preview at
`github.com/Gizmo207/SnapForge-UI`) proved the product. v2 keeps the product and
replaces the fragile, hand-rolled subsystems (the custom preview engine and the
naive string-blocklist "sanitizer") with reviewed boundaries.

---

## How this differs from the protocol's reference project (APInow)

BAP's reference docs describe APInow, a multi-tenant API platform. SnapForge v2
**adopts** BAP's structure and discipline but **reshapes** its scope:

| BAP / APInow concept | SnapForge v2 treatment |
| --- | --- |
| Phase order `01 → 10`, locked | **Adopted as-is.** |
| Pure decision logic isolated from I/O | **Adopted as-is.** Ingestion + sanitization are pure. |
| Invariants enforced at boundaries, not UI | **Adopted as-is.** The sanitization gate is the boundary. |
| Decision ownership (one owner per decision) | **Adopted as-is.** |
| Checkpoints + AI usage rules | **Adopted as-is.** |
| "Default-deny **data exposure**" boundary invariant | **Reframed** → *untrusted pasted code must pass the sanitization gate before it can render or export.* |
| Multi-tenancy / tenants / memberships | **Deferred.** Single user. |
| Identity/data-exposure policy, secret refs, BYOD | **Deferred.** No external data sources. |
| Usage limits, metering, payments (Stripe) | **Deferred.** |
| Firestore + Firebase Auth + per-engine DB clients | **Replaced** by the v2 stack (see `10_delivery_and_ops/tech_stack.md`). |

"Deferred" means intentionally not started — recorded so a future checkpoint can
introduce it explicitly rather than letting it leak in.

---

## The one boundary invariant (read this first)

> **Untrusted pasted code must pass the sanitization gate before it can render
> or export.**

Everything pasted into the vault is untrusted input. It is never executed in the
host page, and never written to an export bundle, until the deterministic
sanitization decision returns an allowed outcome. The live preview runs only
inside a **sandboxed iframe** (Sandpack). This is the v2 analogue of APInow's
default-deny exposure rule, and it is the rule the whole architecture exists to
protect. See `06_decision_rules/sanitization.md`.

---

## Phase index

- `01_prd/` — problem, audience, success criteria
- `02_user_stories/` — the operator, and secondary actors
- `03_user_journeys/` — lifecycle flows
- `04_capabilities/` — what the system must be able to do
- `05_domain_map/` — domain boundaries and ownership
- `06_decision_rules/` — deterministic, default-deny rules (sanitization, ingestion, export, auth)
- `07_data_model_emergence/` — entities, relationships, invariants
- `08_governance/` — ownership, AI usage, enforcement, evolution
- `09_testing_strategy/` — fixture corpus, test-first pure functions, v1 anti-regression
- `10_delivery_and_ops/` — tech stack, deployment, security model

Supplementary, implementation-oriented walkthroughs live in
[`../feature-guides/`](../feature-guides/). Checkpoints live in
[`../checkpoints/`](../checkpoints/).
