import { describe, it, expect } from 'vitest';
import { captureComponent } from './captureComponent';

const deps = { id: () => 'fixed-id', now: () => '2026-06-19T00:00:00Z' };

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
