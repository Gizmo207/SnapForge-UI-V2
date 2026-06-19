# Decision Rules: Authentication (single-owner)

## Purpose

Define the deterministic, default-deny rule for deciding whether a request comes
from the authenticated vault owner. This is deliberately thin: SnapForge v2 is a
single-user product, so there is no authorization matrix, no roles, and no
tenancy — only "is this the owner, yes/no".

## Inputs (conceptual)

- Session evidence status (missing / present / invalid) — a verified Auth.js
  session, established server-side.
- The owner identity the vault is bound to.

## Invariants

- **Default-deny.** No session, or a session that does not resolve to the owner →
  *unauthenticated*. Every vault data path requires the owner.
- **No caller-controlled identity.** Identity comes only from the verified
  session, never from request headers, query params, or client-stored values.
  (This is a direct v1-era anti-pattern guard.)
- **Verified server-side.** Identity is established on the server; the client is
  treated as an untrusted presenter.
- **Single owner.** A valid session that is not the owner is treated the same as
  unauthenticated for this single-user product.

## Outcomes

- **Owner** — proceed.
- **Unauthenticated** (default-deny) — reject; nothing in the vault is reachable.
- **Invalid** (hard failure) — malformed/contradictory session evidence.

## Reference implementation (pure logic)

- `src/domains/identity-access/pure/ownerAuthDecision.ts`
- Session verification adapter: Auth.js (server-side).

Note: multi-user identity, roles, memberships, and tenancy are **deferred** (see
`../README.md`). Introducing them later is a versioned evolution, not a silent
change.
