# AI Usage Rules

## Purpose

Define how AI is allowed to help so it remains a force multiplier instead of a
source of drift. These rules apply to all AI-assisted work on SnapForge v2.

## What AI is allowed to do

- Generate scaffolding that follows the structures defined in this protocol.
- Implement changes that are explicitly requested.
- Refactor within existing boundaries when requested.
- Add tests for the pure ingestion/sanitization/export logic, and extend the
  fixture corpus.
- Summarize current state and produce checkpoint/handoff reports.

## What AI must never do

- Invent classification rules, taxonomy categories, or safety semantics that are
  not grounded in the decision-rule docs or the fixture corpus.
- Smuggle the render/export safety decision into UI, controllers, preview code,
  or "helpers". Only the Sanitization domain decides.
- Reintroduce v1's anti-patterns: substring blocklists as the security
  mechanism, rendering pasted code in the host tree, or trusting client-supplied
  identity.
- Introduce new architectures or technologies (beyond the decided stack) without
  explicit instruction.
- Make broad changes outside the requested scope, or pull deferred scope
  (multi-tenancy, payments, external data sources) into the build without an
  explicit checkpoint.
- Add mock/fake data into non-test paths.

## Test-first discipline (non-negotiable)

The ingestion pipeline and the sanitization gate are pure functions built
**test-first against the fixture corpus**. AI must add or update fixtures and
tests before or alongside the logic, never logic alone.

## Checkpoint discipline

- If a checkpoint says a phase is "not started," AI must not begin it without an
  explicit instruction.
- AI updates checkpoint artifacts only when instructed.

## When AI is uncertain

If ownership, invariants, or scope are unclear: stop and ask. No guessing.
