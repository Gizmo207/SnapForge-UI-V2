'use client';

import { useEffect, useState } from 'react';
import { SandpackProvider, SandpackPreview } from '@codesandbox/sandpack-react';
import type { Component } from '@/domains/shared/component';
import {
  pickShowcase,
  usesTailwind,
  fillsStage,
  backdropCss,
  usesPrivateClassSyntax,
  isThemeToggler,
} from './showcase';
import { buildDemoApp } from '@/domains/preview/pure/demoWrapper';
import {
  rewriteCnImport,
  findUnresolvedAliasImports,
  ensureDefaultExport,
  CN_UTIL_SOURCE,
  CN_SHIM_PATH,
} from '@/domains/preview/pure/shadcn';
import { assembleMultiFilePreview } from '@/domains/preview/pure/multiFilePreview';

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

/**
 * Lower ES2022 class private syntax (`#method()`, `#field`) to a form Sandpack's
 * bundler accepts. Sandpack rejects private members outright ("Class private
 * methods are not enabled"), and feeding it a `.babelrc` doesn't reliably enable
 * them — so we pre-compile the offending files ourselves with Babel (lazy-loaded
 * only when this syntax is present) and hand the bundler already-lowered code.
 * preset-env targets a baseline that lacks private methods, forcing the lowering,
 * while keeping ESM imports intact so the rest of the pipeline is unchanged.
 */
async function lowerPrivateSyntax(files: Record<string, string>): Promise<Record<string, string>> {
  const Babel = await import('@babel/standalone');
  const out: Record<string, string> = { ...files };
  for (const [path, content] of Object.entries(files)) {
    if (path === '/index.tsx') continue; // our own harness — no private syntax
    if (!usesPrivateClassSyntax(content)) continue;
    const res = Babel.transform(content, {
      filename: 'file.tsx',
      presets: [['env', { targets: { chrome: '80' } }], 'react', 'typescript'],
    });
    if (res.code) out[path] = res.code;
  }
  return out;
}

export function PreviewSandbox({ component }: { component: Component }) {
  // Pre-compiled files for components that need private-syntax lowering. Null
  // until the (lazy) transform resolves; only used when `needsTranspile`.
  const [prepared, setPrepared] = useState<Record<string, string> | null>(null);
  const [prepError, setPrepError] = useState<string | null>(null);

  const allowed = component.sanitizationOutcome === 'allowed' && !!component.sanitizedArtifact;

  // Rewrite referenced asset paths to the user's uploaded URLs so the sandbox
  // can load them (3D models, images, fonts the snippet didn't include). Assets
  // can be referenced from the component OR its demo (e.g. an avatarUrl prop), so
  // both get the substitution.
  let artifact = component.sanitizedArtifact ?? '';
  let demoSrc = component.demoSource ?? null;
  for (const asset of component.assets ?? []) {
    artifact = artifact.split(asset.refPath).join(asset.url);
    if (demoSrc) demoSrc = demoSrc.split(asset.refPath).join(asset.url);
  }
  // shadcn/registry components use a named export; the harness imports a default.
  // Add one if missing so they can be imported (no-op for HTML / default exports).
  if (component.framework !== 'html') artifact = ensureDefaultExport(artifact);
  const sc = pickShowcase(component);
  // A user-chosen backdrop replaces the plain stage color so glass/overlay
  // components have something to refract. All backdrops are dark, so pair them
  // with light text for legibility.
  const stageBg = backdropCss(component.backdrop) ?? sc.bg;
  const stageFg = component.backdrop ? '#f3f3f7' : sc.fg;
  // R3F scenes paint their own background and fill their parent; let them fill
  // the stage instead of floating as a small scaled box in dead space.
  const fill = fillsStage(component);
  const isHtml = component.framework === 'html';

  // Multi-file component (uploaded zip/folder): resolve aliases, shim cn, pick a
  // mount file. Its prepared file set replaces the single-file source below.
  const multi =
    !isHtml && component.files && component.entryPath
      ? assembleMultiFilePreview(component.files, component.entryPath)
      : null;
  const appImportPath = multi ? multi.mountSpecifier : './App';

  // Tailwind utility classes need the Tailwind engine running inside the
  // sandbox; inject its runtime only when the snippet actually uses utilities,
  // so self-contained components (styled-components, plain CSS) are untouched.
  const tailwind = usesTailwind(multi ? Object.values(multi.files).join('\n') : artifact);

  const dependencies = isHtml
    ? {}
    : Object.fromEntries(component.dependencies.map((d) => [d, 'latest']));
  if (multi?.cnShimmed) Object.assign(dependencies, { clsx: 'latest', 'tailwind-merge': 'latest' });
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
  // The component's sibling stylesheet (its .css file) is injected as a global
  // style so class-based components render correctly without a file import.
  const cssInject = component.cssSource
    ? `const cssEl = document.createElement('style');
cssEl.textContent = ${JSON.stringify(component.cssSource)};
document.head.appendChild(cssEl);
`
    : '';
  // WebGL/3D scenes size their drawing buffer by window.devicePixelRatio. On a
  // hi-DPI screen in a large stage that's a huge buffer → low FPS and glitchy
  // interaction. Cap the *reported* ratio (only for fill-stage GL components) so
  // they render at a lighter resolution. This only affects code that reads the
  // value to size a canvas; DOM/CSS rasterization is unchanged, so text stays
  // crisp. Capture the real ratio once, then clamp.
  const dprCap = fill
    ? `var __rdpr = window.devicePixelRatio || 1;
try { Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: function(){ return Math.min(__rdpr, 1); } }); } catch(e){}
`
    : '';
  // Theme togglers flip a `.dark` class on <html> and reveal it with a View
  // Transition. Give the stage a theme-responsive background so the actual
  // light↔dark wipe is visible (otherwise the snapshots are identical and only
  // the icon appears to change).
  const stageThemeCss = isThemeToggler(component)
    ? `html{background:#fafafa;color:#18181b}
  html.dark,html[data-theme='dark']{background:#0a0a0f;color:#fafafa}`
    : `html{background:${stageBg};color:${stageFg}}`;
  const entry = `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '${appImportPath}';
${dprCap}${twInject}${cssInject}const s = document.createElement('style');
s.textContent = \`${NO_SCROLL}
  ${stageThemeCss}
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
var FILL = ${fill ? 'true' : 'false'};
const fitEl = document.createElement('div');
fitEl.style.cssText = 'position:fixed;inset:0;display:flex;align-items:' + (FILL ? 'stretch' : 'center') + ';justify-content:' + (FILL ? 'stretch' : 'center') + ';padding:' + (FILL ? '0' : '14px') + ';box-sizing:border-box';
document.getElementById('root').appendChild(fitEl);
createRoot(fitEl).render(React.createElement(PreviewBoundary, null, React.createElement(App)));
function fit(){
  var child = fitEl.firstElementChild;
  if(!child) return;
  // R3F canvases fill the stage edge to edge (they paint their own background).
  if(FILL){
    child.style.transform = 'none';
    child.style.width = '100%';
    child.style.height = '100%';
    return;
  }
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

  // With a usage/demo snippet, the component moves to /Component.tsx and /App.tsx
  // becomes the demo that imports it and renders it WITH content — so wrapper
  // components (which render empty alone) show something real.
  const demoApp = !isHtml && !multi && demoSrc ? buildDemoApp(artifact, demoSrc) : null;
  const files: Record<string, string> = isHtml
    ? {}
    : multi
      ? { ...multi.files, '/index.tsx': entry }
      : demoApp
        ? { '/Component.tsx': artifact, '/App.tsx': demoApp, '/index.tsx': entry }
        : { '/App.tsx': artifact, '/index.tsx': entry };

  // shadcn / Magic UI / Aceternity components import the `cn` helper from a path
  // alias (`@/lib/utils`) that isn't in the pasted code. Provide it as a local
  // shim and rewrite those imports so the component resolves and renders.
  // (Multi-file uploads already had this done in assembleMultiFilePreview.)
  if (!isHtml && !multi) {
    let needsCn = false;
    for (const key of Object.keys(files)) {
      if (key === '/index.tsx') continue;
      const r = rewriteCnImport(files[key]);
      if (r.rewritten) {
        files[key] = r.code;
        needsCn = true;
      }
    }
    if (needsCn) {
      files[CN_SHIM_PATH] = CN_UTIL_SOURCE;
      Object.assign(dependencies, { clsx: 'latest', 'tailwind-merge': 'latest' });
    }
  }

  // After shimming `cn`, any remaining `@/…` / `~/…` import is a local file from
  // the source project that isn't in the paste (a registry component, a sibling
  // UI primitive). Sandpack can't resolve those and would fail cryptically, so
  // surface a clear, actionable message instead of mounting a doomed sandbox.
  const unresolvedAliases = isHtml
    ? []
    : multi
      ? multi.unresolved
      : Array.from(
          new Set(
            Object.entries(files)
              .filter(([k]) => k !== '/index.tsx')
              .flatMap(([, v]) => findUnresolvedAliasImports(v)),
          ),
        );

  // Components written with ES2022 class private members (`#method()`, `#field`)
  // — common in self-contained WebGL/canvas widgets — need pre-compilation
  // before Sandpack can bundle them (see lowerPrivateSyntax).
  const needsTranspile =
    !isHtml &&
    Object.entries(files).some(([k, v]) => k !== '/index.tsx' && usesPrivateClassSyntax(v));

  // Re-run the lazy transform when the relevant inputs change. Keyed on file
  // contents (cheap length+id signature) rather than object identity so it
  // doesn't loop every render.
  const filesKey = needsTranspile
    ? component.componentId + ':' + Object.values(files).map((v) => v.length).join('-')
    : '';
  useEffect(() => {
    if (!needsTranspile) {
      setPrepared(null);
      setPrepError(null);
      return;
    }
    let cancelled = false;
    setPrepared(null);
    setPrepError(null);
    lowerPrivateSyntax(files).then(
      (out) => !cancelled && setPrepared(out),
      (e) => !cancelled && setPrepError(String((e && e.message) || e)),
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesKey, needsTranspile]);

  if (!allowed) return null;

  if (isHtml) {
    const twTag = tailwind ? `<script src="${TAILWIND_CDN}"></script>` : '';
    const srcDoc = `<!doctype html><html><head><meta charset="utf-8"/>${twTag}<style>
      ${NO_SCROLL}
      html{background:${stageBg};color:${stageFg}}
      body{display:grid;place-items:center;padding:16px;
        font-family:Inter,system-ui,-apple-system,sans-serif}
    </style></head><body>${artifact}</body></html>`;
    return (
      <iframe
        title={component.name}
        sandbox=""
        srcDoc={srcDoc}
        style={{ width: '100%', height: '100%', border: 0, background: stageBg }}
      />
    );
  }

  if (unresolvedAliases.length > 0) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          padding: 20,
          textAlign: 'center',
          color: stageFg,
          background: stageBg,
          font: '12.5px/1.6 Inter, system-ui, sans-serif',
        }}
      >
        <div style={{ maxWidth: 360 }}>
          <div style={{ fontSize: 20, marginBottom: 8 }}>🧩</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Missing local files</div>
          <div style={{ opacity: 0.8, marginBottom: 10 }}>
            This code imports files from the source project that aren’t in the paste:
          </div>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 11,
              opacity: 0.9,
              wordBreak: 'break-all',
              marginBottom: 10,
            }}
          >
            {unresolvedAliases.join('  ·  ')}
          </div>
          <div style={{ opacity: 0.7 }}>
            Paste the component’s <strong>actual source</strong> (the library’s “Manual” install
            tab) into the main box — not just the usage/demo snippet.
          </div>
        </div>
      </div>
    );
  }

  if (needsTranspile && prepError) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          padding: 16,
          textAlign: 'center',
          color: stageFg,
          background: stageBg,
          font: '12.5px/1.5 Inter, system-ui, sans-serif',
        }}
      >
        <div>
          <div style={{ fontSize: 18, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Preview unavailable</div>
          <div style={{ opacity: 0.75, wordBreak: 'break-word' }}>{prepError.slice(0, 200)}</div>
        </div>
      </div>
    );
  }

  // While the lazy Babel transform runs, hold the stage with a spinner.
  const finalFiles = needsTranspile ? prepared : files;
  if (!finalFiles) {
    return (
      <div className="stage-poster" aria-hidden style={{ background: stageBg }}>
        <span className="stage-spinner" />
      </div>
    );
  }

  return (
    <SandpackProvider
      template="react-ts"
      theme={sc.theme}
      customSetup={{ dependencies }}
      files={finalFiles}
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
