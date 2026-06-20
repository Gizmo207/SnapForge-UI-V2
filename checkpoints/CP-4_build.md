# CP-4 — Execution Realization (the build)

**Date:** 2026-06-20
**Status:** In progress. The protocol-critical core is implemented and verified;
runtime integrations are scaffolded and compile, pending live credentials.

## What is complete and verified

### The two non-negotiables (verified green)
- **Pure ingestion pipeline, test-first against a fixture corpus.**
  `detectFramework`, `inferName`, `detectDependencies`, `classify`, and `ingest`
  live in `src/domains/ingestion/pure/`, are pure/total/deterministic, and are
  pinned by `src/tests/fixtures/ingestionCorpus.ts`.
- **The sanitization gate (the boundary invariant).**
  `src/domains/sanitization/pure/` decides on a parsed/cleaned representation —
  **DOMPurify** for HTML, the **TypeScript AST** for React/JSX — never on
  substring scans. Default-deny. Pinned by an adversarial corpus
  (`src/tests/fixtures/adversarialCorpus.ts`) that explicitly defeats v1's old
  blocklist (casing tricks, `window`/`document` access, `dangerouslySetInnerHTML`,
  `<script>`, event handlers, `javascript:` URLs).

### Other pure domains (verified)
- Export bundle logic (`src/domains/export/pure/`) — gated by sanitization, only
  `allowed` components contribute files; missing-artifact reporting; deterministic.
- Single-owner auth decision (`src/domains/identity-access/pure/`) — default-deny.
- Capture controller (`src/app-core/captureComponent.ts`) — orchestration that
  wires ingestion + the gate into a `Component`; proven to keep a hostile snippet
  `blocked` with no artifact.

### Verification performed
- **54 tests pass** (`npm test`).
- **Typecheck clean** (`tsc --noEmit`).
- **Production build succeeds** (`next build`) — all routes compile.
- **Smoke test** against real v1 components (google-search-input, hover-card,
  animated-form): correct framework/name/category, `styled-components` detected,
  gate `allowed`.

### Scaffolded and compiling (need live config to run)
- Next.js App Router shell: `src/app/` (layout, gallery page, global styles).
- Route handlers: `POST/GET /api/components`, `POST /api/export`,
  `/api/auth/[...nextauth]` — each gated by `requireOwner`.
- Adapters: Supabase vault repository + client, Auth.js (GitHub) config +
  session→owner wiring, JSZip export adapter.
- Preview boundary: `PreviewSandbox` renders `allowed` components **only inside
  Sandpack's sandboxed iframe**, re-checking the gate at the boundary.
- `supabase/schema.sql` — `components` table with a CHECK constraint enforcing
  the data-model invariant (artifact may exist only when outcome = allowed) +
  RLS; `.env.example` documents required config.

## What is intentionally not started

- A configured live environment: Supabase project, Auth.js provider secrets,
  `OWNER_ID`. The app falls back to a sign-in screen / empty vault without them
  rather than crashing.
- Deferred scope remains deferred (multi-tenancy, external data sources, usage
  limits, payments).
- Polish: richer paste UX (currently a prompt), gallery virtualization, an ESLint
  config, and end-to-end/browser tests of the live preview.

## Risks accepted for now

- The live preview and auth/persistence paths are verified by typecheck + build,
  not by a running browser session (no credentials in this environment).
- `detectFramework` is heuristic; the build hardened it (JSX-without-import is now
  correctly routed to the JSX gate — a safety fix found by a test), but new edge
  cases should be added to the corpus as they appear.

## Next

- Provision a Supabase project + Auth provider, set env, run `supabase/schema.sql`,
  and exercise the full loop (paste → gate → preview → export) in a browser.
- Add browser/e2e coverage of the sandbox boundary and an ESLint config.
