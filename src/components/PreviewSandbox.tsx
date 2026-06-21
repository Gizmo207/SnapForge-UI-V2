'use client';

import { SandpackProvider, SandpackPreview } from '@codesandbox/sandpack-react';
import type { Component } from '@/domains/shared/component';
import { pickShowcase, usesTailwind } from './showcase';

const TAILWIND_CDN = 'https://cdn.tailwindcss.com';

/**
 * The Preview boundary. Renders pasted code ONLY inside a sandbox — never in the
 * host React tree — and re-checks the gate: a component that is not `allowed` is
 * never handed to a renderer.
 *
 *  - HTML  -> a fully locked <iframe sandbox=""> (no script execution).
 *  - React -> Sandpack's sandboxed bundler. Detected dependencies are declared
 *             so packages like styled-components resolve from the CDN. The
 *             component is centered on a showcase background, no scrollbars.
 */
const NO_SCROLL = `html,body{margin:0;height:100%;overflow:hidden}*{box-sizing:border-box}
  ::-webkit-scrollbar{width:0;height:0;display:none}`;

export function PreviewSandbox({ component }: { component: Component }) {
  if (component.sanitizationOutcome !== 'allowed' || !component.sanitizedArtifact) {
    return null;
  }

  const artifact = component.sanitizedArtifact;
  const sc = pickShowcase(component);
  // Tailwind utility classes need the Tailwind engine running inside the
  // sandbox; inject its runtime only when the snippet actually uses utilities,
  // so self-contained components (styled-components, plain CSS) are untouched.
  const tailwind = usesTailwind(artifact);

  if (component.framework === 'html') {
    const twTag = tailwind ? `<script src="${TAILWIND_CDN}"></script>` : '';
    const srcDoc = `<!doctype html><html><head><meta charset="utf-8"/>${twTag}<style>
      ${NO_SCROLL}
      html{background:${sc.bg};color:${sc.fg}}
      body{display:grid;place-items:center;padding:16px;
        font-family:Inter,system-ui,-apple-system,sans-serif}
    </style></head><body>${artifact}</body></html>`;
    return (
      <iframe
        title={component.name}
        sandbox=""
        srcDoc={srcDoc}
        style={{ width: '100%', height: '100%', border: 0, background: sc.bg }}
      />
    );
  }

  const dependencies = Object.fromEntries(component.dependencies.map((d) => [d, 'latest']));
  // Background goes on <html> ONLY (the canvas). If <body> also had a background,
  // it would paint as a normal box at z-index 0 and hide a component's
  // negative-z-index layers (glow borders, blurred shadows). With only <html>
  // painted, those layers render above the canvas and stay visible.
  const twInject = tailwind
    ? `const tw = document.createElement('script');
tw.src = '${TAILWIND_CDN}';
document.head.appendChild(tw);
`
    : '';
  const entry = `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
${twInject}const s = document.createElement('style');
s.textContent = \`${NO_SCROLL}
  html{background:${sc.bg};color:${sc.fg}}
  body{margin:0;min-height:100vh;display:grid;place-items:center;overflow:hidden}
  #root{display:contents}\`;
document.head.appendChild(s);
const fitEl = document.createElement('div');
fitEl.id = 'fit';
fitEl.style.transformOrigin = 'center center';
document.getElementById('root').appendChild(fitEl);
createRoot(fitEl).render(React.createElement(App));
// Auto-fit: scale the rendered component down so it never overflows the tile.
function fit(){
  fitEl.style.transform = 'none';
  const r = fitEl.getBoundingClientRect();
  if(!r.width || !r.height) return;
  const aw = window.innerWidth - 28, ah = window.innerHeight - 28;
  const scale = Math.min(1, aw / r.width, ah / r.height);
  fitEl.style.transform = 'scale(' + scale + ')';
}
try { new ResizeObserver(fit).observe(fitEl); } catch(e){}
window.addEventListener('resize', fit);
[0,80,250,600,1200].forEach(function(t){ setTimeout(fit, t); });`;

  return (
    <SandpackProvider
      template="react-ts"
      theme={sc.theme}
      customSetup={{ dependencies }}
      files={{ '/App.tsx': artifact, '/index.tsx': entry }}
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
