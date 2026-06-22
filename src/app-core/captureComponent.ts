import { ingest } from '../domains/ingestion/pure/ingest';
import { looksLikeOnlyCss } from '../domains/ingestion/pure/looksLikeCss';
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
  // Guard the most common paste mistake: dropping a component's .css file into
  // the main code box. Without the JSX/HTML there's nothing to render, so fail
  // loudly with a fix instead of saving a card that prints CSS as text.
  if (looksLikeOnlyCss(source)) {
    throw new Error(
      'This looks like a CSS stylesheet, not a component. Paste the component’s ' +
        'JSX/HTML in the main box, then put this CSS in the “separate CSS file” field below.',
    );
  }

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
