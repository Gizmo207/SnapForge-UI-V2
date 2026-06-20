'use client';

import { Sandpack } from '@codesandbox/sandpack-react';
import type { Component } from '@/domains/shared/component';

/**
 * The Preview boundary. It renders pasted code ONLY inside Sandpack's sandboxed
 * iframe — never in the host React tree. It re-checks the gate here: a component
 * that is not `allowed` is never handed to the sandbox.
 *
 * See build_anything_protocol/06_decision_rules/sanitization.md and
 * feature-guides/preview.md.
 */
export function PreviewSandbox({ component }: { component: Component }) {
  // Re-enforce the invariant at the render boundary; do not trust upstream.
  if (component.sanitizationOutcome !== 'allowed' || !component.sanitizedArtifact) {
    return (
      <div className="preview-blocked" role="status">
        Cannot preview: this component did not pass the sanitization gate
        ({component.sanitizationOutcome}).
      </div>
    );
  }

  const artifact = component.sanitizedArtifact;

  if (component.framework === 'react') {
    return (
      <Sandpack
        template="react-ts"
        options={{ showTabs: false, editorHeight: 0, showConsole: false }}
        files={{
          '/Component.tsx': artifact,
          '/App.tsx': `import Component from './Component';\nexport default function App(){ return <Component />; }`,
        }}
      />
    );
  }

  return (
    <Sandpack
      template="static"
      options={{ showTabs: false, editorHeight: 0 }}
      files={{
        '/index.html': `<!doctype html><html><head><meta charset="utf-8"/></head><body>${artifact}</body></html>`,
      }}
    />
  );
}
