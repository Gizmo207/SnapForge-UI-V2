# Deployment Model (SnapForge UI v2)

## Goal

Deploy safely with low operational friction for a single-user product.

---

## Vercel-hosted Next.js (modular monolith)

### Components
- Next.js app (UI + Server Components).
- Next.js route handlers (ingestion, sanitization gate, export endpoints).
- Supabase/Postgres (the Component Vault).
- Sandpack-powered sandboxed iframe for previews (runs client-side, isolated).

### Why
- Fast iteration, minimal infrastructure.
- Keeps product and domain logic tightly coupled early.

---

## Boundaries (must hold even in a monolith)

- **UI:** presentation and intent collection only — no decisions.
- **Controllers / route handlers:** orchestration only — gather inputs, invoke
  pure decisions, route outcomes.
- **Pure domains** (`ingestion`, `sanitization`, `export`): deterministic logic
  only, no I/O.
- **Adapters / services:** I/O only (Supabase, DOMPurify, TS/SWC, zip, Auth.js).
- **Sandbox:** the only place pasted code runs.

---

## Operational checklist (minimum)

- Verified owner on every protected route; default-deny.
- Pasted code never rendered outside the Sandpack iframe.
- Sanitization gate enforced at render and export boundaries.
- Vault is durable across deploys; schema changes additive/migrated.

---

## Later (optional, by checkpoint only)

If the product ever grows beyond single-user, extracting the pure domains into a
dedicated service is possible without rewriting them — but multi-user, sharing,
and any deferred scope are introduced only through an explicit checkpoint, never
by drift.
