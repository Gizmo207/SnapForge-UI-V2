import { ingest } from '../domains/ingestion/pure/ingest';
import { decideSanitization } from '../domains/sanitization/pure/sanitizationDecision';
import { jsxGate } from '../domains/sanitization/pure/jsxGate';
import { buildDemoApp } from '../domains/preview/pure/demoWrapper';
import type { Component } from '../domains/shared/component';

export type CaptureDeps = {
  /** Injected so the controller stays deterministic and testable. */
  id: () => string;
  now: () => string;
};

/**
 * Removes relative stylesheet imports (e.g. `import './GlassSurface.css'`) from
 * a React artifact. The sandbox bundler can't resolve a sibling file that isn't
 * present; the stylesheet travels separately as `cssSource` and is injected into
 * the preview. Without this, a perfectly safe component would fail to render.
 */
export function stripCssImports(code: string): string {
  return code.replace(/^[ \t]*import\s+['"][^'"]+\.css['"];?[ \t]*\r?\n?/gm, '');
}

/**
 * Capture controller (orchestration only — it decides nothing).
 *
 * It gathers inputs (the pasted source, plus an optional sibling stylesheet),
 * invokes the authoritative pure decisions (ingestion, then the sanitization
 * gate), and assembles a Component. Render/export authority lives in
 * `sanitizationOutcome` / `sanitizedArtifact`, which come straight from the gate.
 */
export function captureComponent(
  source: string,
  deps: CaptureDeps,
  css?: string,
  demo?: string,
): Component {
  const ingestion = ingest(source);
  const decision = decideSanitization(source, ingestion.framework);
  const timestamp = deps.now();

  // The gate validated the original source; we then drop unresolvable .css
  // imports so the artifact can actually render in the sandbox.
  const artifact = decision.sanitizedArtifact
    ? stripCssImports(decision.sanitizedArtifact)
    : decision.sanitizedArtifact;

  const cssSource = css && css.trim() ? css.trim() : null;

  // A usage/demo snippet is rendered in the same sandbox, so it must clear the
  // same gate. We probe the demo wrapped as a module; only safe demos are kept.
  let demoSource: string | null = null;
  if (demo && demo.trim() && artifact) {
    const probe = buildDemoApp(artifact, demo);
    if (probe && jsxGate(probe).outcome === 'allowed') {
      demoSource = demo.trim();
    }
  }

  return {
    componentId: deps.id(),
    name: ingestion.name,
    framework: ingestion.framework,
    source,
    sanitizedArtifact: artifact,
    sanitizationOutcome: decision.outcome,
    category: ingestion.category,
    subcategory: ingestion.subcategory,
    tags: ingestion.tags,
    dependencies: ingestion.dependencies,
    cssSource,
    demoSource,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
