# Decision Rules (06)

## Purpose

Define deterministic, default-deny rules for the key safety and correctness
decisions. These rules describe *what* must be decided and *what outcomes exist*,
not how controllers wire them.

A decision rule is a rulebook, not an opinion: the same inputs always produce the
same outcome, and when evidence is missing the rule locks (default-deny).

## What belongs here

- Decision inputs (conceptual)
- Invariants
- Outcomes

## What does not belong here

- Controller logic
- Persistence / I-O behavior
- UI policy logic

## Rules in this phase

- `sanitization.md` — **the boundary.** May this code render or export?
- `ingestion.md` — framework, name, dependencies, classification (deterministic).
- `export.md` — may a set of components be assembled into a bundle?
- `auth.md` — is the request the authenticated owner? (single-user, thin)

> The protocol's APInow rules for data exposure, connections, and multi-tenant
> identity are intentionally **not** reproduced here — they are deferred scope
> for the single-user vault.
