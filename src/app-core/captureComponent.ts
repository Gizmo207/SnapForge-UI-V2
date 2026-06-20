import { ingest } from '../domains/ingestion/pure/ingest';
import { decideSanitization } from '../domains/sanitization/pure/sanitizationDecision';
import type { Component } from '../domains/shared/component';

export type CaptureDeps = {
  /** Injected so the controller stays deterministic and testable. */
  id: () => string;
  now: () => string;
};

/**
 * Capture controller (orchestration only — it decides nothing).
 *
 * It gathers inputs (the pasted source), invokes the authoritative pure
 * decisions (ingestion, then the sanitization gate), and assembles a Component.
 * Render/export authority lives in `sanitizationOutcome` / `sanitizedArtifact`,
 * which come straight from the gate — this controller never softens or
 * re-derives them.
 */
export function captureComponent(source: string, deps: CaptureDeps): Component {
  const ingestion = ingest(source);
  const decision = decideSanitization(source, ingestion.framework);
  const timestamp = deps.now();

  return {
    componentId: deps.id(),
    name: ingestion.name,
    framework: ingestion.framework,
    source,
    sanitizedArtifact: decision.sanitizedArtifact,
    sanitizationOutcome: decision.outcome,
    category: ingestion.category,
    subcategory: ingestion.subcategory,
    tags: ingestion.tags,
    dependencies: ingestion.dependencies,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
