# Feature Guide: Ingestion

Owner domain: **Ingestion** (pure). Decision rules:
[`../build_anything_protocol/06_decision_rules/ingestion.md`](../build_anything_protocol/06_decision_rules/ingestion.md).

## What it does

Turns a pasted snippet into structured metadata, with no I/O and no safety
judgement:

```
ingest(source) -> {
  framework: 'react' | 'html',
  name: string,            // always non-empty
  dependencies: string[],  // sorted, de-duped, third-party only
  category: string,        // safe fallback: 'components'
  subcategory: string,     // safe fallback: 'misc'
  tags: string[],          // sorted, additive
}
```

## Shape of the code

```
src/domains/ingestion/pure/
  detectFramework.ts     // react vs html
  inferName.ts           // identifier → display name, with fallbacks
  detectDependencies.ts  // import/require → package roots
  classify.ts            // priority-ordered rules → category/subcategory/tags
  ingest.ts              // composes the four above
```

Each file is a pure function. `ingest.ts` composes them; classification context
(subcategory, tags) feeds `inferName`.

## Carried over from v1 (the behavioral seed)

v1's `lab/src/parser/*` is the starting behavior and the seed of the fixture
corpus:

- `detectFramework`: React import or `useState(` → `react`, else `html`.
- `inferName`: extract a non-generic identifier, split camelCase, Title Case;
  else style-prefix + subcategory label; else the subcategory label.
- `detectDependencies`: scan `import`/`require`, drop relative paths and built-ins
  (`react`, `react-dom`, jsx-runtime), collapse scoped/sub-path specifiers.
- `classify`: priority-ordered rule list where **structural rules outrank keyword
  rules** (a `<form>`+`<input>` is a form, not a button), plus additive tag rules.

## Build discipline (non-negotiable)

- **Test-first against the fixture corpus.** Add the fixture (input + expected
  output) before/with the rule. See
  [`../build_anything_protocol/09_testing_strategy/README.md`](../build_anything_protocol/09_testing_strategy/README.md).
- **Total, never throwing.** Unrecognizable input returns the safe fallback
  (`components` / `misc`), never an exception that reaches the gallery.
- **No safety here.** Ingestion never decides whether code may render or export —
  that is the Sanitization gate, run separately.

## Where it runs

In a Next.js route handler (or server action) on paste. The pure functions have
no I/O, so they are trivially unit-testable and could also run client-side; the
authoritative run is server-side alongside the gate and persistence.
