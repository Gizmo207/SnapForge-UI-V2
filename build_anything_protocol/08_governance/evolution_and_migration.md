# Evolution and Migration Rules

## Purpose

Define how behavior and stored artifacts evolve over time without silent breaking
changes.

## Core principle

Change is inevitable. Breaking changes must be explicit.

## Stored components must keep working

The vault is durable. As ingestion rules, the taxonomy, or the sanitizer evolve:

- Existing Components must remain readable.
- Schema changes are additive or migrated — never silently lossy.
- If re-classification or re-sanitization of existing Components is desired, it is
  an explicit, batch, reviewable operation (a migration), not an implicit side
  effect of deploying new rules.

## Deferred scope is introduced by checkpoint, not by drift

Multi-tenancy, external data sources, usage limits, and payments are deferred.
Adding any of them is a new, explicit phase gated by a checkpoint — not something
that accretes through small "while I'm here" changes.

## Taxonomy and rule changes are versioned thinking

- Prefer adding rules/categories over mutating the meaning of existing ones.
- When a classification rule's behavior changes, update the fixture corpus in the
  same change so the new behavior is pinned and intentional.

## The boundary invariant never weakens

The sanitization gate may get *stricter* freely. Any change that would make it
more permissive is a security decision requiring explicit review and
corresponding fixtures — never a quiet default change.
