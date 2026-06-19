# Invariant Enforcement Points

## Purpose

Invariants are non-negotiable truths. This document defines **where** they must
be enforced so they cannot be bypassed.

## Core rule

Invariants are enforced at system boundaries — not only written on a sign (UI),
but checked at the door.

## Enforcement points (SnapForge v2)

- **Before rendering a preview:** the Preview boundary must confirm the
  Component's `sanitizationOutcome` is `allowed` *and* render only inside the
  sandboxed iframe. No host-tree rendering of pasted source, ever.
- **Before writing an export bundle:** the Export boundary must confirm each
  Component is `allowed` and has the framework-appropriate artifact.
- **Before serving any vault data:** the auth boundary must confirm the request
  is the owner (verified session), default-deny otherwise.
- **At ingestion:** the pipeline must always return a complete result; malformed
  input is contained as a safe fallback, not a thrown error reaching the gallery.

## UI-only enforcement is forbidden

UI checks (disabled buttons, hidden cards) are helpful UX but are **not** safety
boundaries — they can be bypassed and go stale. The gate is enforced server-side
/ at the render boundary regardless of what the UI shows.

## "Checked earlier" is not a guarantee

Export must not assume Preview validated a Component, and Preview must not assume
ingestion did. Re-check `sanitizationOutcome` at each boundary where it matters.

## The sandbox is a boundary, not a convenience

The sandboxed iframe is a security-reviewed boundary. Anything that would render
pasted code outside it — for performance, for SSR, for "just this one case" — is
an invariant violation.
