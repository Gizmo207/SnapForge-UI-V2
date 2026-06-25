import { describe, it, expect } from 'vitest';
import { toSummary, toPayload, matchesQuery } from './shape';
import type { Component } from '../../shared/component';

function comp(over: Partial<Component> = {}): Component {
  return {
    componentId: 'id-1',
    name: 'Pulsating Button',
    framework: 'react',
    source: 'export default function B(){ return <button/>; }',
    sanitizedArtifact: 'export default function B(){ return <button/>; }',
    sanitizationOutcome: 'allowed',
    category: 'components',
    subcategory: 'buttons',
    tags: ['button', 'animation'],
    dependencies: ['clsx'],
    showcaseTheme: null,
    backdrop: null,
    htmlSource: null,
    cssSource: null,
    demoSource: null,
    files: null,
    entryPath: null,
    createdAt: 't',
    updatedAt: 't',
    ...over,
  };
}

describe('toSummary', () => {
  it('produces a lightweight summary and flags multi-file', () => {
    expect(toSummary(comp())).toEqual({
      id: 'id-1',
      name: 'Pulsating Button',
      framework: 'react',
      category: 'components',
      subcategory: 'buttons',
      tags: ['button', 'animation'],
      multiFile: false,
    });
    expect(toSummary(comp({ files: { '/a.tsx': 'x' } })).multiFile).toBe(true);
  });
});

describe('toPayload', () => {
  it('prefers the sanitized artifact and includes export fields', () => {
    const p = toPayload(comp({ cssSource: '.x{}', demoSource: '<B/>' }));
    expect(p.source).toContain('function B');
    expect(p.dependencies).toEqual(['clsx']);
    expect(p.css).toBe('.x{}');
    expect(p.demo).toBe('<B/>');
  });

  it('falls back to raw source when no sanitized artifact', () => {
    const p = toPayload(comp({ sanitizedArtifact: null, source: 'raw-source' }));
    expect(p.source).toBe('raw-source');
  });

  it('passes through a multi-file map + entry path', () => {
    const p = toPayload(comp({ files: { '/components/ui/x.tsx': 'code' }, entryPath: '/components/ui/x.tsx' }));
    expect(p.files).toEqual({ '/components/ui/x.tsx': 'code' });
    expect(p.entryPath).toBe('/components/ui/x.tsx');
  });
});

describe('matchesQuery', () => {
  it('matches across name, category, and tags; all terms must hit', () => {
    expect(matchesQuery(comp(), 'button')).toBe(true);
    expect(matchesQuery(comp(), 'pulsating animation')).toBe(true);
    expect(matchesQuery(comp(), 'pulsating carousel')).toBe(false);
    expect(matchesQuery(comp(), '')).toBe(true);
  });
});
