import { ingestFiles } from '../domains/ingestion/pure/multiFile';
import { fixInlineStyleVars } from '../domains/ingestion/pure/fixInlineStyles';
import { decideSanitization } from '../domains/sanitization/pure/sanitizationDecision';
import type { Component } from '../domains/shared/component';
import type { CaptureDeps } from './captureComponent';

/**
 * Capture controller for an uploaded multi-file component (zip/folder). Picks the
 * entry, classifies it, and runs the sanitization gate over EVERY file (so a
 * blocked pattern anywhere fails the whole component). Orchestration only — the
 * gate decides safety.
 */
export function captureFiles(rawFiles: Record<string, string>, deps: CaptureDeps): Component {
  // Repair unquoted CSS-variable keys in inline styles across every file.
  const fixed = Object.fromEntries(
    Object.entries(rawFiles).map(([path, content]) => [path, fixInlineStyleVars(content)]),
  );
  const ingestion = ingestFiles(fixed);
  if (!ingestion) {
    throw new Error(
      'No React component found in the upload. Make sure the zip/folder contains the ' +
        'component’s .tsx/.jsx source (not just an install command or CSS).',
    );
  }

  // Gate the concatenation of every file: any disallowed pattern blocks it all.
  const allCode = Object.values(ingestion.files).join('\n');
  const decision = decideSanitization(allCode, 'react');
  const timestamp = deps.now();

  return {
    componentId: deps.id(),
    name: ingestion.name,
    framework: 'react',
    source: ingestion.source,
    // The preview renders from `files`; keep the entry as the artifact so the
    // record is non-null when allowed and single-file export still works.
    sanitizedArtifact: decision.outcome === 'allowed' ? ingestion.source : null,
    sanitizationOutcome: decision.outcome,
    category: ingestion.category,
    subcategory: ingestion.subcategory,
    tags: ingestion.tags,
    dependencies: ingestion.dependencies,
    cssSource: null,
    demoSource: null,
    files: ingestion.files,
    entryPath: ingestion.entry,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
