# Tech Stack (SnapForge UI v2)

This replaces BAP's APInow-specific stack doc with the stack decided for the
single-user UI component vault.

## Goal

Choose a stack that:

- Ships quickly as a modular monolith.
- Makes the sanitization/sandbox boundary a reviewed, off-the-shelf concern
  rather than hand-rolled code.
- Keeps boundaries clean (pure decisions vs I/O).
- Keeps a clean upgrade path without a rewrite.

---

## Frontend & runtime

### Next.js (App Router) — modular monolith
Why:
- One codebase for UI, route handlers, and server-side auth.
- Server Components reduce client complexity; route handlers host the ingestion,
  gate, and export endpoints next to the product while the domain model
  stabilizes.
- Vercel-native deployment.

Principle: start as a modular monolith; the pure domains
(`src/domains/*/pure`) stay extractable if the app ever splits.

---

## Preview sandbox

### Sandpack (sandboxed iframe)
Why:
- Renders React/HTML snippets live **inside a sandboxed iframe**, never in the
  host React tree — exactly the boundary v1 lacked.
- Off-the-shelf, maintained bundling/runtime for component previews, replacing
  v1's hand-rolled `reactPreviewEngine` and its naive blocklist.

Rule: the host page never imports or evaluates pasted source. An `allowed`
sanitization outcome authorizes rendering **only** in the Sandpack iframe.

---

## Sanitization

### DOMPurify (HTML) + TS/SWC (React/JSX)
Why:
- **DOMPurify** is a maintained, security-focused HTML sanitizer with a
  deny-by-default allowlist — replacing v1's substring blocklist.
- **TS/SWC** parses React/JSX to an AST so the gate evaluates a real parse tree,
  not raw strings.

Rule: the sanitization decision is pure and owns render/export authority
(`../06_decision_rules/sanitization.md`). These libraries are the adapters it
calls; they do not make the product decision themselves.

---

## Persistence

### Supabase / Postgres (the Component Vault)
Why:
- Durable, queryable storage for Components and their metadata; good fit for
  browse/search.
- Managed Postgres with a straightforward Next.js integration.

What it stores: Components, variants, inferred metadata, and
`sanitizationOutcome`. What it is **not**: a place that decides render/export
(that is `sanitizationOutcome`, set by the gate) and not an external data plane
(there is none — deferred).

---

## Auth

### Auth.js (single-owner)
Non-negotiables:
- Identity comes only from the verified server-side session — never from
  caller-controlled headers, query params, or client storage.
- Every vault data path verifies the owner; default-deny otherwise.

---

## Export

### Server-side zip assembly
- The Export domain (pure) computes bundle contents from `allowed` Components; a
  thin adapter streams the zip. (v1 used `archiver`; any maintained zip lib is
  fine — it is I/O only.)

---

## Tooling

- TypeScript end-to-end; SWC for fast transform/parse.
- Test runner exercising the fixture corpus (Vitest or equivalent).

---

## Explicitly not in the stack (deferred)

- No external database clients / BYOD (`pg`, `mysql2`, `mongodb`, …) — no data
  plane.
- No payments (Stripe), no metering.
- No multi-tenant identity infrastructure.

---

## Summary

The stack deliberately moves v1's two riskiest custom subsystems — the preview
engine and the "sanitizer" — onto reviewed, maintained boundaries (Sandpack,
DOMPurify, TS/SWC), and keeps the product decisions (ingestion, gate, export) as
pure, test-first logic the app owns.
