# Decision Rules: Sanitization (the boundary invariant)

## Purpose

Define the deterministic, default-deny rule for deciding whether a pasted snippet
is allowed to **render** (in the sandboxed preview) or **export** (into a
bundle). This is the central safety boundary of SnapForge v2 — the analogue of
APInow's default-deny data-exposure rule.

> **Untrusted pasted code must pass this gate before it can render or export.**

## Why this exists (v1 anti-regression)

v1 had no real gate. Its "sanitizer" only rewrote JSX ergonomics (`class` →
`className`, boolean attributes, SVG camelCase) and its only safety check was a
substring blocklist — `isUnsafePreviewSource` scanning for `<script`, `window.`,
`document.`, `eval(`. That is trivially bypassed (`window`, event-handler
attributes, `eval` via aliases, data: URLs, etc.) and conflated *cosmetic
rewriting* with *security*. v2 separates the two concerns and makes the security
decision a real, owned, default-deny boundary backed by **DOMPurify** (for HTML)
and an AST-based check via **TS/SWC** (for React/JSX) — not string matching.

## Inputs (conceptual)

- Source evidence status (missing / present / invalid).
- Framework (from the ingestion `detectFramework` decision).
- The sanitized artifact produced by the framework-appropriate sanitizer:
  - HTML: DOMPurify-cleaned markup + a record of what was stripped.
  - React/JSX: an AST-validated transform (TS/SWC) + a record of rejected
    constructs.
- A residual-risk signal: whether any disallowed construct survived or could not
  be safely transformed.

## Invariants

- **Default-deny.** Missing or empty source → *blocked*. Anything the sanitizer
  cannot fully account for → *blocked*, never "allowed by assumption".
- **Storage is not rendering.** A snippet may be persisted in a non-renderable
  state without ever being *allowed*; persistence must never imply the gate
  passed.
- **The decision is pure and reviewable from the source alone.** No network, no
  host-page state, no UI input influences the outcome.
- **One owner.** Only the Sanitization domain produces this outcome. Preview and
  Export consume it; they must not re-derive, soften, or override it.
- **No substring blocklists as the security mechanism.** Decisions are made on a
  parsed/cleaned representation (DOMPurify DOM, or AST), never on raw string
  scans. (String checks may exist only as fast pre-filters that can *block*, never
  as the thing that *allows*.)
- **Rendering happens only in the sandbox.** An *allowed* outcome authorizes
  rendering **only** inside the sandboxed iframe, never the host tree.

## Outcomes

- **Allowed** — the sanitized artifact may render in the sandbox and be written
  to an export bundle.
- **Blocked** (default-deny) — must not render in any host-reachable context and
  must not enter a bundle. May still be stored for review.
- **Invalid** (hard failure) — evidence itself is malformed/contradictory; treat
  as a hard failure, distinct from a clean *blocked*.

## Reference implementation (pure logic)

- `src/domains/sanitization/pure/sanitizationDecision.ts`
- HTML cleaner adapter: DOMPurify (configured, deny-by-default allowlist).
- JSX validator adapter: TS/SWC AST checks.

Note: these paths are expected to exist in this product repo once CP-4 (the
build) begins; they do not exist yet at the documentation checkpoint.
