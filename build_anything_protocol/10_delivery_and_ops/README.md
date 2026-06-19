# Delivery and Ops

## Goal

Ship SnapForge UI v2 safely with predictable, low-friction operations for a
single-user product.

## Operational requirements (conceptual)

- Verified owner identity on every vault data path; default-deny otherwise.
- Pasted code rendered only inside the sandboxed iframe — never the host page.
- The sanitization gate enforced at the render and export boundaries, not the UI.
- Ingestion failures contained as safe fallbacks; the gallery never crashes on a
  bad paste.
- Clear surfacing of *why* a snippet was blocked.

## Release discipline

- Default-deny for the render/export boundary; the gate may only get stricter
  without review.
- Stored Components remain readable across releases (additive/migrated schema).
- Deferred scope (multi-tenancy, payments, external data) enters only via an
  explicit checkpoint.

## Incident readiness

- Be able to answer: which Component was blocked and why.
- Be able to take the app down or roll back without losing the vault (durable
  Supabase/Postgres storage).

## Documents in this phase

- `tech_stack.md` — the concrete v2 stack.
- `deployment_model.md` — how it deploys.
- `security_model.md` — how unsafe states are made impossible by default.
