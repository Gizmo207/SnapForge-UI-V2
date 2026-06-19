# Feature Guides

Implementation-oriented walkthroughs that supplement the
[`build_anything_protocol/`](../build_anything_protocol/) phase docs. The
protocol docs define *what must be true and who owns each decision*; these guides
describe *how each feature is built* within those rules.

Each guide stays inside the boundaries set by the protocol — especially the
single boundary invariant:

> Untrusted pasted code must pass the sanitization gate before it can render or
> export.

## Guides

- [`ingestion.md`](./ingestion.md) — paste → framework, name, dependencies,
  classification (pure, test-first).
- [`preview.md`](./preview.md) — rendering `allowed` components in the Sandpack
  sandbox.
- [`gallery-and-search.md`](./gallery-and-search.md) — browsing the taxonomy and
  searching the vault.
- [`export.md`](./export.md) — multi-select → clean zip bundle.
- [`auth.md`](./auth.md) — single-owner authentication.

These are intentionally written before CP-4 (the build). They describe the
intended implementation; nothing here exists in code yet.
