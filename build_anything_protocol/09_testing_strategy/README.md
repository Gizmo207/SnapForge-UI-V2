# Testing Strategy

## Goal

Prove the ingestion logic and the sanitization safety boundary are correct, and
prevent regressions — especially the specific mistakes v1 made.

## The fixture corpus (the spine of this strategy)

The ingestion pipeline and the sanitization gate are built **test-first** against
a **fixture corpus** of real pasted snippets. The corpus lives in the repo
(e.g. `tests/fixtures/`) and pairs each input snippet with its expected outcome.

Each fixture records:

- the raw pasted `source`,
- expected `framework`, `name`, `dependencies`, `category`, `subcategory`,
  `tags` (the ingestion contract),
- expected `sanitizationOutcome` (`allowed` / `blocked` / `invalid`) and, for
  hostile inputs, the reason.

The corpus is seeded from v1's real components (`foundations/`, `primitives/`,
`components/`, `patterns/`, `layouts/`, `pages/`) and grown with adversarial
inputs.

## Focus

- **Pure decision logic gets the most tests.** `detectFramework`, `inferName`,
  `detectDependencies`, `classify`, and the sanitization decision are exhaustively
  tested against the corpus. They have no I/O, so they are fast and deterministic.
- **Boundaries are tested at boundary level.** Preview must refuse to render a
  non-`allowed` Component and must render only in the sandbox; Export must exclude
  non-`allowed` Components; auth must default-deny.
- **Adapters** (DOMPurify config, TS/SWC validation, zip assembly, Supabase
  persistence) are tested for I/O correctness and error mapping.

## Adversarial corpus (security regression)

The corpus must include hostile inputs that explicitly defeat v1's old approach,
asserting each is **blocked**:

- `<script>` and event-handler attributes (`onclick`, `onerror`, …).
- `javascript:` / `data:` URLs.
- `eval`, `Function`, and aliased/obfuscated equivalents.
- Casing/whitespace tricks that beat a substring blocklist (`WINDOW .`, `wIndow`).
- Markup that DOMPurify strips, asserting the *outcome* is blocked, not just that
  text changed.

## Non-goals

- No snapshot testing of business rules through the UI.
- No "mocked" production behavior outside tests.
- No rendering of pasted code outside the sandbox in any test path.

## Regression anchors (v1 mistakes encoded as tests)

- Identity must never come from client-controlled input.
- The render/export gate must never be a substring blocklist — adversarial
  fixtures prove parsed/cleaned evaluation.
- Pasted code must never execute in the host tree — a Preview boundary test
  asserts sandbox-only rendering.
- Classification must be total — a "garbage input" fixture asserts the safe
  `components / misc` fallback rather than a crash.
