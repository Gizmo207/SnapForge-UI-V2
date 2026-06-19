# Decision Rules: Export Eligibility

## Purpose

Define the deterministic, default-deny rule for deciding whether a set of
selected components may be assembled into an export bundle, and what goes into it.

## Inputs (conceptual)

- The selected component set.
- For each component: its framework, its sanitization outcome, and the
  framework-appropriate source artifact (React source, or HTML + CSS).

## Invariants

- **Gated by sanitization.** A component may be written to a bundle only if its
  sanitization outcome is *allowed*. *Blocked* / *invalid* components are
  excluded — Export never re-judges safety, it only honors the existing outcome.
- **Default-deny on missing artifacts.** If the framework-appropriate source for
  a component is absent (e.g. no HTML variant for an HTML bundle), that component
  is reported as missing and excluded, not silently emitted empty.
- **Framework-appropriate layout.** React components export as `react.tsx` files
  under their component path; HTML components export as combined `index.html` +
  `styles.css`.
- **Deterministic.** The same selection produces the same bundle contents and
  layout.
- **Clean output.** Bundles contain only component artifacts and a clear
  per-component heading/path — no app-internal state.

## Outcomes

- **Bundle** — a deterministic set of files for the *allowed*, artifact-complete
  components, plus a report of any excluded/missing components.
- **Empty** (default-deny) — no eligible components; produce a clearly-marked
  empty result rather than a malformed archive.

## Reference implementation (pure logic)

- `src/domains/export/pure/buildExportBundle.ts`

Note: v1's `lab/src/pure/exportBundles.ts` is the behavioral starting point.
