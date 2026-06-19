# Entities

Schemas emerge from decision inputs, invariants, lifecycle transitions, and
ownership boundaries — not directly from user stories. Because v2 is single-user,
there is no tenant/membership layer; the owner is implicit and singular.

The durable source of truth is the **Component Vault** (Supabase/Postgres). The
*runtime* sandbox (Sandpack iframe) is the execution surface and stores nothing.

---

## Owner

The single account the vault is bound to. Exists only to anchor authentication;
contains no authorization logic.

**Durability:** durable.

**Fields (conceptual)**
- ownerId
- identityProvider
- identityProviderSubject
- status

---

## Component

The central entity: one captured snippet plus everything ingestion and the gate
derived from it.

**Decision alignment**
- `framework` — from `detectFramework`.
- `name` — from `inferName`.
- `dependencies` — from `detectDependencies`.
- `category`, `subcategory`, `tags` — from `classify`.
- `sanitizationOutcome` — from the Sanitization decision (allowed / blocked /
  invalid). **This field, not the presence of the row, authorizes render/export.**

**Durability:** durable; edits are expected (re-paste, rename, re-classify).

**Fields (conceptual)**
- componentId
- name
- framework            (react | html)
- source               (raw pasted source — stored, not implicitly renderable)
- sanitizedArtifact    (cleaned HTML or AST-validated transform; present only
                        when outcome is `allowed`)
- sanitizationOutcome  (allowed | blocked | invalid)
- category
- subcategory
- tags                 (string[])
- dependencies         (string[])
- createdAt
- updatedAt

---

## ComponentVariant (optional, emergent)

A component may carry framework variants (e.g. a `react.tsx` plus an `html.html`
+ `styles.css`) that Export consumes. Modeled separately when a single component
holds multiple source artifacts.

**Fields (conceptual)**
- variantId
- componentId
- kind                 (react | html | css)
- source

---

## IngestionResult (value object, not necessarily persisted)

The pure output of the ingestion pipeline for a given source. Conceptually it is
folded into the Component fields above; it is named here because it is the unit
the fixture-corpus tests assert against.

**Fields (conceptual)**
- framework
- name
- category, subcategory, tags
- dependencies

---

## Deferred (intentionally not modeled now)

- Tenant / Workspace, TenantMembership — single-user product.
- Connection, ExposurePolicy, secretRef — no external data sources.
- ApiVersion, UsageRecord — no published API surface or metering.

These are recorded as deferred so a future checkpoint introduces them explicitly
rather than letting them leak in.
