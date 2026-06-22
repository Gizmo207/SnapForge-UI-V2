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
  body{margin:0;width:100vw;height:100vh;overflow:hidden}
  #root{display:contents}\`;
document.head.appendChild(s);
// An error boundary so a component that throws at runtime (e.g. a Three.js scene
// whose external .glb asset isn't bundled with the snippet) shows a readable
// note instead of a blank/crashed canvas.
class PreviewBoundary extends React.Component {
  constructor(p){ super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err){ return { err: err }; }
  render(){
    if(this.state.err){
      var msg = String((this.state.err && this.state.err.message) || this.state.err);
      return React.createElement('div',
        { style: { maxWidth: 280, padding: 16, textAlign: 'center', font: '12.5px/1.5 Inter, system-ui, sans-serif', opacity: 0.8 } },
        React.createElement('div', { style: { fontSize: 18, marginBottom: 8 } }, '⚠️'),
        React.createElement('div', { style: { fontWeight: 600, marginBottom: 6 } }, 'Preview unavailable'),
        React.createElement('div', { style: { opacity: 0.75, wordBreak: 'break-word' } }, msg.slice(0, 200))
      );
    }
    return this.props.children;
  }
}
// A definite, full-tile flex box so percentage-sized components (e.g. a loader
// whose root is width/height:100%) have a real box to fill instead of
// collapsing to zero. We then scale the rendered child down if it overflows.
const fitEl = document.createElement('div');
fitEl.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box';
document.getElementById('root').appendChild(fitEl);
createRoot(fitEl).render(React.createElement(PreviewBoundary, null, React.createElement(App)));
function fit(){
  var child = fitEl.firstElementChild;
  if(!child) return;
  child.style.transform = 'none';
  child.style.width = '';
  child.style.height = '';
  var r = child.getBoundingClientRect();
  // A percentage-sized component (root is width/height:100%) collapses to ~0
  // because the wrapper isn't stretched — let it fill the tile instead.
  if(r.width < 8 || r.height < 8){
    child.style.width = '100%';
    child.style.height = '100%';
    return;
  }
  // Otherwise it's a natural-size component: scale down only if it overflows.
  var aw = window.innerWidth - 24, ah = window.innerHeight - 24;
  var scale = Math.min(1, aw / r.width, ah / r.height);
  child.style.transformOrigin = 'center center';
  child.style.transform = 'scale(' + scale + ')';
}
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
