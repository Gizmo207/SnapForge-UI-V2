# SnapForge UI v2 — Kickoff

This file preserves the original kickoff brief for v2, for provenance. The
authoritative, expanded version of everything below now lives in
[`build_anything_protocol/`](./build_anything_protocol/) and
[`feature-guides/`](./feature-guides/).

---

**Build SnapForge UI v2 using the Build Anything Protocol.**

**Context:** v2 is a clean rebuild of SnapForge UI — a single-user **UI component
vault**. Core loop: *paste a React or HTML snippet → it's auto-parsed (framework
detect, name infer, dependency detect, classify into taxonomy), sanitized, and
previewed live in a gallery → browse/search → multi-select export as a zip
bundle.* (v1 lives at github.com/Gizmo207/SnapForge-UI — a Vite SPA + Express +
Postgres + custom parser/preview. We're keeping the product, replacing the
fragile custom subsystems.)

**Methodology:** Apply the Build Anything Protocol
(github.com/Gizmo207/The-Build-Anything-Protocol). Follow its locked phase order
`01_prd → 10_delivery_and_ops` and its governance/AI-usage/checkpoint rules.

**Scope it down — this is NOT APInow:** Adopt BAP's phase structure, governance,
pure-decision-logic discipline, and boundary-invariant rules as-is. But this is a
single-user vault, so **defer** multi-tenancy, identity/data-exposure policy,
usage limits, and payments. **Reframe** BAP's "default-deny exposure" invariant
as the real boundary here: *untrusted pasted code must pass the sanitization gate
before it can render or export.* Rewrite BAP's APInow-specific
`10_delivery_and_ops/tech_stack.md` for our stack.

**Decided stack:** Next.js (App Router, modular monolith) + Supabase/Postgres +
Auth.js + **Sandpack** for the preview sandbox + **DOMPurify** + TS/SWC for
sanitization.

**Two technical non-negotiables:** (1) The ingestion pipeline (`detectFramework`,
`inferName`, `detectDependencies`, `classify`, `sanitize`) is **pure functions,
built test-first against a fixture corpus** of real pasted snippets. (2) The
preview runs in a **sandboxed iframe**, never in the host tree — treat it as a
security-reviewed boundary.

**First task:** Generate the full docs suite as the BAP `01–10` folder
structure, scoped to the single-user vault, plus a `feature-guides/` supplement
(ingestion, preview, gallery/search, export, auth). Then checkpoint and start
CP-4 (the build).
