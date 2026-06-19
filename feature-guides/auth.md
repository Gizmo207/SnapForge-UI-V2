# Feature Guide: Auth

Owner domain: **Identity & Access** (single-owner). Rules:
[`../build_anything_protocol/06_decision_rules/auth.md`](../build_anything_protocol/06_decision_rules/auth.md).

## What it does

Authenticates the single vault owner and gates all vault data paths. There is no
authorization matrix, no roles, no tenancy — only "is this the owner".

## Flow

1. Owner signs in via Auth.js (e.g. an OAuth provider).
2. Auth.js establishes a verified, server-side session.
3. Every vault route resolves identity from that session and applies the pure
   owner-auth decision: `owner` → proceed; otherwise default-deny.

## Shape of the code

```
src/domains/identity-access/pure/
  ownerAuthDecision.ts   // session evidence -> owner | unauthenticated | invalid
src/domains/identity-access/
  session.ts             // Auth.js session verification (I/O)
```

## Rules

- **Verified session only.** Identity never comes from caller-controlled headers,
  query params, or client storage. (Direct v1-era anti-pattern guard.)
- **Default-deny.** No session resolving to the owner → no access to any vault
  data.
- **Server-side enforcement.** The client is an untrusted presenter; route
  handlers/server components enforce the decision regardless of UI state.
- **Single owner.** A valid non-owner session is treated as unauthenticated for
  this single-user product.

## Deferred

Multi-user accounts, roles, sharing, and tenancy are out of scope and are
introduced (if ever) only via an explicit checkpoint, not by drift
([`../build_anything_protocol/08_governance/evolution_and_migration.md`](../build_anything_protocol/08_governance/evolution_and_migration.md)).
