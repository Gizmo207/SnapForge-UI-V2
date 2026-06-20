# Decision Rules: Authentication (multi-user)

## Purpose

Define the deterministic, default-deny rule for deciding whether a request comes
from an authenticated user, and which vault it may access. SnapForge v2 is
**multi-user**: every authenticated account is the owner of its **own** vault.
There is still no authorization matrix, no roles, and no cross-user sharing —
each user only ever sees their own data.

> Scope note: v2 originally shipped as a single-owner vault (see CP-4). It was
> deliberately opened to multi-user in CP-5. The data model already scoped every
> row by `owner_id`, so this was a logic change, not a schema change.

## Inputs (conceptual)

- Session evidence status (missing / present / invalid) — a verified Auth.js
  session, established server-side.
- The user identity carried by the session (`${provider}:${accountId}`).

## Invariants

- **Default-deny.** No session → *unauthenticated*. Every vault data path
  requires an identified user.
- **No caller-controlled identity.** Identity comes only from the verified
  session, never from request headers, query params, or client-stored values.
- **Verified server-side.** Identity is established on the server; the client is
  treated as an untrusted presenter.
- **Per-user isolation.** All vault reads and writes are scoped to the identified
  user's id. One user can never read or export another user's components.
- **Contradictory evidence is invalid.** A present session that carries no user
  id is a hard failure, not an "unauthenticated".

## Outcomes

- **Identified** — proceed, scoped to this user's vault.
- **Unauthenticated** (default-deny) — reject; nothing in any vault is reachable.
- **Invalid** (hard failure) — malformed/contradictory session evidence.

## Reference implementation (pure logic)

- `src/domains/identity-access/pure/viewerIdentity.ts`
- Session verification adapter: `src/adapters/auth/session.ts` (Auth.js,
  server-side) + `authOptions.ts` (GitHub + Google providers).

Note: roles, teams, and cross-user sharing remain **deferred** and would be a
future, versioned evolution.
