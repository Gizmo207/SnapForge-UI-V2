'use client';

import { SandpackProvider, SandpackPreview } from '@codesandbox/sandpack-react';
import type { Component } from '@/domains/shared/component';

/**
 * The Preview boundary. Renders pasted code ONLY inside a sandbox — never in the
 * host React tree — and re-checks the gate here: a component that is not
 * `allowed` is never handed to a renderer.
 *
 *  - HTML  -> a fully locked <iframe sandbox=""> (no script execution at all);
 *             the artifact is already DOMPurify-cleaned.
 *  - React -> Sandpack's sandboxed iframe bundler (deps resolve from npm).
 */
export function PreviewSandbox({ component }: { component: Component }) {
  if (component.sanitizationOutcome !== 'allowed' || !component.sanitizedArtifact) {
    return null;
  }

  const artifact = component.sanitizedArtifact;

  if (component.framework === 'html') {
    const srcDoc = `<!doctype html><html><head><meta charset="utf-8"/><style>
      html,body{height:100%;margin:0}
      body{display:grid;place-items:center;padding:14px;background:transparent;color:#f3f3f7;
        font-family:Inter,system-ui,-apple-system,sans-serif}
    </style></head><body>${artifact}</body></html>`;
    return (
      <iframe
        title={component.name}
        sandbox=""
        srcDoc={srcDoc}
        style={{ width: '100%', height: '100%', border: 0, background: 'transparent' }}
      />
    );
  }

  return (
    <SandpackProvider
      template="react-ts"
      theme="dark"
      files={{ '/App.tsx': artifact }}
      style={{ height: '100%' }}
    >
      <SandpackPreview
        showOpenInCodeSandbox={false}
        showRefreshButton={false}
        showSandpackErrorOverlay
        style={{ height: '100%' }}
      />
    </SandpackProvider>
  );
}
