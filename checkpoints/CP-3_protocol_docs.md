# CP-3 — Protocol Documentation Suite

**Date:** 2026-06-19
**Status:** Complete (documentation/design). CP-4 (Execution Realization / the
build) **not started**.

## What is complete

The full Build Anything Protocol docs suite for SnapForge UI v2, scoped to the
single-user vault:

- `build_anything_protocol/01_prd` … `10_delivery_and_ops` — all phases, with the
  APInow-specific stack doc rewritten for the v2 stack (Next.js App Router +
  Supabase/Postgres + Auth.js + Sandpack + DOMPurify + TS/SWC).
- The boundary invariant is defined and threaded through every phase:
  *untrusted pasted code must pass the sanitization gate before it can render or
  export.*
- Decision rules authored for: sanitization (the boundary), ingestion, export,
  and single-owner auth.
- Data model (entities/relationships/invariants) with render/export authority
  living in `sanitizationOutcome`, not row existence.
- Governance: decision ownership map, AI usage rules, invariant enforcement
  points, evolution/migration rules.
- Testing strategy centered on the fixture corpus and v1 anti-regression anchors.
- `feature-guides/` supplement: ingestion, preview, gallery/search, export, auth.
- `KICKOFF.md` preserved for provenance.

## What is intentionally not started

- **CP-4 (the build).** No application code, no `src/domains/*`, no schema, no
  fixture corpus files exist yet. All reference-implementation paths in the docs
  are intended, not present.
- **Deferred scope** (recorded, not begun): multi-tenancy/sharing, external data
  sources / data-exposure policy, usage limits/metering, payments.

## How this follows the protocol

- Phase order `01 → 10` was followed and kept intact.
- BAP's discipline was adopted as-is (pure decisions vs I/O, invariants enforced
  at boundaries, one owner per decision, AI usage rules, checkpoints).
- BAP's "default-deny data exposure" invariant was **reframed** — not dropped —
  into the sanitization gate, which is the real boundary for a code vault.
- Deferred APInow concepts are explicitly marked deferred so they enter later by
  checkpoint, not by drift.

## Risks accepted for now

- The docs describe intended behavior; real edge cases (Sandpack/DOMPurify
  configuration limits, classification ambiguity) will only surface during CP-4
  and the fixture corpus build.
- The fixture corpus does not exist yet; until it does, the test-first guarantee
  is a commitment, not a fact.
- v1 parser behavior is the seed but has known rough edges (keyword-based
  classification); CP-4 is expected to refine rules against real fixtures.

## Next checkpoint

- **CP-4 (Execution Realization):** stand up the Next.js monolith; implement the
  pure ingestion pipeline and sanitization gate **test-first against the fixture
  corpus**; wire Supabase persistence, Auth.js, the Sandpack preview boundary,
  and export. CP-4 begins only on explicit instruction.
