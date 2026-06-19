# Decision Rules: Ingestion

## Purpose

Define deterministic rules for analyzing a pasted snippet: framework detection,
name inference, dependency detection, and classification. Ingestion is **pure**
and built **test-first** against the fixture corpus (see
`../09_testing_strategy/README.md`). It never decides safety — that is the
Sanitization domain's job.

These are four cooperating sub-decisions. Each is deterministic: identical source
yields an identical result.

## detectFramework

- **Inputs:** source text.
- **Outcomes:** `react` | `html`.
- **Invariants:** the result is total (always one of the two) and stable. React
  is indicated by React import/JSX/hooks signals; otherwise `html`. The fixture
  corpus pins edge cases (e.g. HTML-in-template-literal, styled-components).

## inferName

- **Inputs:** source text, classification context (subcategory, tags).
- **Outcomes:** a non-empty display name.
- **Invariants:** prefer a meaningful identifier from the code; reject generic
  identifiers (`button`, `wrapper`, `app`, …); fall back to a
  style-prefix + subcategory label, then to the subcategory label. The result is
  always non-empty and deterministic.

## detectDependencies

- **Inputs:** source text.
- **Outcomes:** a sorted, de-duplicated list of third-party package names.
- **Invariants:** relative/absolute-path imports are excluded; built-ins
  (`react`, `react-dom`, jsx-runtime) are excluded; scoped packages collapse to
  `@scope/name`; sub-paths collapse to the package root. Both `import` and
  `require` forms are covered.

## classify

- **Inputs:** source text.
- **Outcomes:** `{ category, subcategory, tags[] }`.
- **Invariants:**
  - The rule set is a deterministic, **priority-ordered** match — the
    highest-priority matching rule wins; ties are resolved by a stable order.
  - Structural rules outrank keyword rules (e.g. a `<form>` containing `<input>`
    classifies as a form, not a button).
  - Classification is **total**: unrecognizable input falls back to a safe
    default (`components / misc`) rather than failing.
  - Tags are additive and sorted; they never change the category.

## Cross-cutting invariants

- Ingestion is **pure** (no I/O, no network, no clock, no randomness).
- Ingestion **never throws to the caller**: malformed input produces a safe
  fallback result, never a crash that reaches the gallery.
- Ingestion does not gate safety; a result here does not imply *allowed* to
  render. Only the Sanitization decision does that.

## Reference implementation (pure logic)

- `src/domains/ingestion/pure/detectFramework.ts`
- `src/domains/ingestion/pure/inferName.ts`
- `src/domains/ingestion/pure/detectDependencies.ts`
- `src/domains/ingestion/pure/classify.ts`
- `src/domains/ingestion/pure/ingest.ts` (composition)

Note: these paths are expected to exist once CP-4 begins. v1's equivalents
(`lab/src/parser/*`) are the behavioral starting point and the seed of the
fixture corpus.
