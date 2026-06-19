# SnapForge UI v2

A single-user **UI component vault**. Core loop:

> Paste a React or HTML snippet → it's auto-parsed (framework detect, name infer,
> dependency detect, classify into a taxonomy), **sanitized**, and **previewed
> live** in a sandboxed gallery → browse/search → multi-select **export** as a
> zip bundle.

v2 is a clean rebuild of [SnapForge UI](https://github.com/Gizmo207/SnapForge-UI)
(v1). It keeps the product and replaces v1's fragile custom subsystems (the
hand-rolled preview engine and the substring-blocklist "sanitizer") with reviewed
boundaries: **Sandpack** for the sandboxed preview and **DOMPurify** + TS/SWC for
sanitization.

## The boundary invariant

> Untrusted pasted code must pass the sanitization gate before it can render or
> export.

## Documentation

Built with the
[Build Anything Protocol](https://github.com/Gizmo207/The-Build-Anything-Protocol).

- [`build_anything_protocol/`](./build_anything_protocol/) — the full `01–10`
  phase docs (PRD → delivery & ops), scoped to the single-user vault.
- [`feature-guides/`](./feature-guides/) — implementation walkthroughs
  (ingestion, preview, gallery/search, export, auth).
- [`checkpoints/`](./checkpoints/) — milestone save points.
- [`KICKOFF.md`](./KICKOFF.md) — original kickoff brief (provenance).

## Stack

Next.js (App Router, modular monolith) · Supabase/Postgres · Auth.js · Sandpack ·
DOMPurify · TypeScript/SWC.

## Status

Documentation suite complete (see
[`checkpoints/CP-3_protocol_docs.md`](./checkpoints/CP-3_protocol_docs.md)). The
build (CP-4) has not started.
