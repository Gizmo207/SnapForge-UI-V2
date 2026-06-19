# Relationships

Conceptual relationships that should remain stable even if implementation details
change. v2 is single-user, so everything hangs off the implicit single Owner
rather than a tenant.

## Owner
- Owner 1..N Components (the entire vault belongs to the one owner).

## Component
- Component belongs to exactly 1 Owner.
- Component 0..N ComponentVariants.
- Component has exactly 1 sanitizationOutcome (the render/export authority).
- Component has exactly 1 IngestionResult folded into its metadata.

## ComponentVariant
- ComponentVariant belongs to exactly 1 Component.

## Ordering of derivation (lifecycle, not a foreign key)
- source → IngestionResult (framework, name, dependencies, classification)
- source + framework → sanitizationOutcome (+ sanitizedArtifact when allowed)
- sanitizationOutcome = allowed → eligible for Preview and Export

## Deferred relationships
- No Tenant→* fan-out (no tenancy).
- No Component→Connection / Component→ExposurePolicy (no external data sources).
