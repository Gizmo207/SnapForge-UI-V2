# Capabilities

What the product must be able to do, extracted from the user stories and
journeys. Each capability is owned by exactly one domain (see
`../05_domain_map/domain_map.md`).

## Identity & access (single-owner)
- Authenticate the single owner.
- Default-deny: no vault data is reachable unauthenticated.
- (Deferred: multi-user, roles, sharing, tenancy.)

## Ingestion (pure)
- Detect the framework of a pasted snippet (React or HTML).
- Infer a human-recognizable name from the source.
- Detect third-party dependencies from imports/requires.
- Classify the snippet into category / subcategory / tags via deterministic
  rules.
- Always produce a result, including a safe fallback for unrecognizable input.

## Sanitization gate (pure — the boundary)
- Decide deterministically whether a snippet is allowed to render or export.
- Default-deny: missing or invalid evidence blocks.
- Produce a reviewable outcome (allowed / blocked / invalid) from the source
  alone.

## Sandboxed preview
- Render an *allowed* component live inside a sandboxed iframe.
- Never execute pasted code in the host page/tree.
- Confine any failure or hostile behavior to the component's own preview.

## Storage & retrieval
- Persist components with their source, inferred metadata, and gate outcome.
- Browse components grouped by the taxonomy.
- Search by name, framework, category, subcategory, and tags.

## Export
- Multi-select components.
- Build a framework-appropriate bundle for *allowed* components only.
- Produce a single clean zip suitable for dropping into another project.

## Observability (minimal)
- Surface ingestion/gate outcomes to the operator (including why something was
  blocked).
- Keep failures diagnosable without crashing the gallery.

## Explicitly deferred capabilities
- Multi-tenancy and sharing.
- External data-source connections / data-exposure policy / secret refs.
- Usage metering, limits, and payments.
- Server-side execution of pasted code.
