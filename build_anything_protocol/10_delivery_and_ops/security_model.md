# Security Model (SnapForge UI v2)

## Goal

Make unsafe states impossible by default. This model is explicitly designed to
avoid v1's failure modes:

- a substring blocklist masquerading as sanitization,
- conflating cosmetic JSX rewriting with security,
- a hand-rolled preview engine rendering pasted code with weak isolation.

---

## The boundary invariant

> Untrusted pasted code must pass the sanitization gate before it can render or
> export.

Everything below serves this rule.

## Untrusted input

- All pasted source is untrusted.
- It is analyzed (ingestion) and gated (sanitization) before it can render or
  export.
- Storing source is not rendering source: a stored Component is inert until the
  gate marks it `allowed`.

## Sanitization

Principles:
- Decisions are made on a parsed/cleaned representation — DOMPurify's cleaned DOM
  for HTML, a TS/SWC AST for React/JSX — never on raw string scans.
- Default-deny: anything the sanitizer cannot fully account for is `blocked`.
- The gate may only get stricter without review; loosening it is a reviewed
  security decision with corresponding fixtures.

## Execution isolation

Principles:
- Pasted code executes **only** inside the Sandpack sandboxed iframe.
- The host page never imports or evaluates Component source.
- A hostile snippet's blast radius is its own preview — it cannot reach the host
  page, the session, or other Components.

## Identity

Principles:
- Identity is the verified Auth.js server-side session only.
- Caller-controlled headers/params/client-storage are never identity signals.
- Default-deny: no session resolving to the owner → no vault access.

## Auditability (minimal, single-user)

Principles:
- Surface why a Component was blocked.
- Keep ingestion/gate outcomes inspectable for the operator.

## Threat-model reminders

- Treat every paste as adversarial.
- Treat the UI as an untrusted presenter; enforce at boundaries.
- Never render pasted code outside the sandbox.
- The render/export decision is centralized, deterministic, and single-owned.
