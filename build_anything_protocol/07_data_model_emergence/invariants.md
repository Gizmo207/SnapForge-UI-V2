# Invariants (Data Model)

The durable truths the vault must enforce. These are implied by the decision
rules (`../06_decision_rules/`) and the entity/relationship model.

---

## Ownership invariants
- Every Component belongs to the single Owner.
- Vault data is reachable only for the authenticated Owner (see
  `../06_decision_rules/auth.md`). Default-deny when the session is absent or
  unverified.

---

## Sanitization invariants
Reference: `../06_decision_rules/sanitization.md`

- `sanitizationOutcome` is always one of: `allowed`, `blocked`, `invalid`.
- **Render/export authority lives in `sanitizationOutcome`, never in row
  existence.** A stored Component is not, by virtue of being stored, renderable.
- `sanitizedArtifact` may be present **only** when the outcome is `allowed`.
- A Component whose outcome is not `allowed` must never be emitted into an export
  bundle and must never render in a host-reachable context.
- Re-pasting or editing source re-runs the gate; the outcome and artifact are
  recomputed, never carried over.

---

## Ingestion invariants
Reference: `../06_decision_rules/ingestion.md`

- `framework` is always `react` or `html`.
- `name` is always non-empty.
- `dependencies` is sorted and de-duplicated and excludes built-ins and
  relative imports.
- `category`/`subcategory` are always populated (safe fallback `components` /
  `misc`); `tags` is sorted.
- Ingestion never persists a partial/exception state; it always yields a complete
  IngestionResult.

---

## Export invariants
Reference: `../06_decision_rules/export.md`

- Only `allowed` Components contribute files to a bundle.
- A Component lacking the framework-appropriate artifact is reported missing and
  excluded, never emitted empty.

---

## Preview invariants
- A Component renders only inside the sandboxed iframe, only when `allowed`.
- The host page never imports or evaluates Component source.

---

## Evolution invariants
- Stored Components must remain readable and re-ingestable as the app evolves;
  schema changes are additive/migrated, never silently lossy (see
  `../08_governance/evolution_and_migration.md`).
