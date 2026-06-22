import { describe, it, expect } from 'vitest';
import { captureComponent, stripCssImports } from './captureComponent';

const deps = { id: () => 'fixed-id', now: () => '2026-06-19T00:00:00Z' };

describe('multi-file capture (component + css)', () => {
  it('strips sibling .css imports so the artifact can render in the sandbox', () => {
    const code = `import './GlassSurface.css';\nimport { useRef } from 'react';\nexport default function G(){ return <div className="glass-surface" />; }`;
    const c = captureComponent(code, deps, '.glass-surface { color: red; }');
    expect(c.sanitizationOutcome).toBe('allowed');
    expect(c.sanitizedArtifact).not.toContain(".css'");
    expect(c.sanitizedArtifact).toContain("import { useRef }");
    expect(c.cssSource).toBe('.glass-surface { color: red; }');
  });

  it('leaves cssSource null when no css is supplied', () => {
    const c = captureComponent(`export default function B(){ return <button/>; }`, deps);
    expect(c.cssSource).toBeNull();
  });

  it('stripCssImports keeps non-css imports intact', () => {
    const out = stripCssImports(`import './a.css';\nimport x from './x';\n`);
    expect(out).toBe(`import x from './x';\n`);
  });
});

describe('captureComponent (orchestration)', () => {
  it('captures a safe react snippet as an allowed component with an artifact', () => {
    const c = captureComponent(
      `import React from 'react';\nexport default function PrimaryButton(){ return <button className="btn">Go</button>; }`,
      deps,
    );
    expect(c.framework).toBe('react');
    expect(c.name).toBe('Primary Button');
    expect(c.subcategory).toBe('buttons');
    expect(c.sanitizationOutcome).toBe('allowed');
    expect(c.sanitizedArtifact).not.toBeNull();
  });

  it('captures a hostile snippet as blocked, with NO artifact (default-deny)', () => {
    const c = captureComponent(
      `export default function C(){ return <div>{document.cookie}</div>; }`,
      deps,
    );
    expect(c.sanitizationOutcome).toBe('blocked');
    expect(c.sanitizedArtifact).toBeNull(); // never renderable/exportable
  });

  it('still ingests metadata for a blocked snippet (storage is not rendering)', () => {
    const c = captureComponent(`<button onclick="x()">hi</button>`, deps);
    expect(c.sanitizationOutcome).toBe('blocked');
    expect(c.subcategory).toBe('buttons'); // classified, but inert
    expect(c.source).toContain('onclick');
  });

  it('is deterministic given fixed deps', () => {
    const src = `<div class="card">x</div>`;
    expect(captureComponent(src, deps)).toEqual(captureComponent(src, deps));
  });
});
