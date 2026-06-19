# Feature Guide: Export

Owner domain: **Export** (pure bundle logic), gated by **Sanitization**. Rules:
[`../build_anything_protocol/06_decision_rules/export.md`](../build_anything_protocol/06_decision_rules/export.md).

## What it does

Takes a multi-selection of Components and produces a single clean zip bundle,
ready to drop into another project.

## Flow

1. Operator multi-selects Components in the gallery.
2. Export filters the selection to `allowed` Components (gate honored, not
   re-judged) that have the framework-appropriate artifact.
3. The pure bundle builder produces deterministic file contents:
   - **React:** one `react.tsx` per component, under its component path, each
     prefixed with a path comment.
   - **HTML:** a combined `index.html` (each component as a commented section)
     plus a combined `styles.css`.
4. A thin adapter streams the files as a zip download.
5. Excluded/missing components are reported back to the operator.

## Shape of the code

```
src/domains/export/pure/
  buildExportBundle.ts   // selection -> { files, excluded, missing } (pure)
src/domains/export/
  zipAdapter.ts          // files -> zip stream (I/O only)
```

v1's `lab/src/pure/exportBundles.ts` is the behavioral seed (React concatenation,
HTML/CSS assembly, `missingNames` reporting).

## Rules

- **Gated by sanitization.** Only `allowed` Components enter a bundle; Export
  never re-evaluates safety.
- **Default-deny on missing artifacts.** No HTML variant for an HTML bundle →
  reported missing and excluded, never emitted empty.
- **Deterministic & clean.** Same selection → same bundle; no app-internal state
  in the output.
- **Empty is a valid, explicit outcome.** No eligible components → a clearly
  marked empty result, not a malformed archive.
