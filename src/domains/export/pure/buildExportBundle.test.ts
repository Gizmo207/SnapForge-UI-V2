import { describe, it, expect } from 'vitest';
import { buildExportBundle } from './buildExportBundle';
import type { Component } from '../../shared/component';

function component(overrides: Partial<Component>): Component {
  return {
    componentId: 'id-' + (overrides.name ?? 'x'),
    name: 'Sample',
    framework: 'react',
    source: '<button/>',
    sanitizedArtifact: '<button/>',
    sanitizationOutcome: 'allowed',
    category: 'primitives',
    subcategory: 'buttons',
    tags: [],
    dependencies: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('buildExportBundle', () => {
  it('includes allowed react components as react.tsx files', () => {
    const bundle = buildExportBundle([
      component({ name: 'Primary Button', framework: 'react', sanitizedArtifact: '<button>Go</button>' }),
    ]);
    expect(bundle.isEmpty).toBe(false);
    expect(bundle.files.some((f) => f.path === 'react/primary-button.tsx')).toBe(true);
  });

  it('excludes components that did not pass the gate (default-deny)', () => {
    const bundle = buildExportBundle([
      component({ name: 'Evil', sanitizationOutcome: 'blocked', sanitizedArtifact: null }),
    ]);
    expect(bundle.isEmpty).toBe(true);
    expect(bundle.excludedUnsafe).toContain('Evil');
  });

  it('never re-judges safety: a blocked component contributes no files even with a source', () => {
    const bundle = buildExportBundle([
      component({ name: 'Sneaky', sanitizationOutcome: 'invalid', source: '<button/>', sanitizedArtifact: '<button/>' }),
    ]);
    // invalid != allowed -> excluded regardless of artifact presence
    expect(bundle.files.length).toBe(0);
    expect(bundle.excludedUnsafe).toContain('Sneaky');
  });

  it('reports missing artifacts rather than emitting empty', () => {
    const bundle = buildExportBundle([
      component({ name: 'NoArtifact', framework: 'react', sanitizationOutcome: 'allowed', sanitizedArtifact: '' }),
    ]);
    expect(bundle.missingArtifact).toContain('NoArtifact');
    expect(bundle.isEmpty).toBe(true);
  });

  it('assembles html components into index.html + styles.css', () => {
    const bundle = buildExportBundle([
      component({
        name: 'Hero',
        framework: 'html',
        sanitizationOutcome: 'allowed',
        sanitizedArtifact: '<section>Hi</section>',
        htmlSource: '<section>Hi</section>',
        cssSource: '.hero { color: red; }',
      }),
    ]);
    const paths = bundle.files.map((f) => f.path).sort();
    expect(paths).toEqual(['html/index.html', 'html/styles.css']);
    const css = bundle.files.find((f) => f.path === 'html/styles.css')!.contents;
    expect(css).toContain('.hero');
  });

  it('bundles provided assets under public/ and reports missing ones', () => {
    const bundle = buildExportBundle([
      component({
        name: 'Fluid Glass',
        source: "const m = '/assets/3d/lens.glb'; const n = '/assets/3d/bar.glb';",
        sanitizedArtifact: '<Scene/>',
        assets: [{ refPath: '/assets/3d/lens.glb', url: 'https://cdn.test/lens.glb', filename: 'lens.glb' }],
      }),
    ]);
    expect(bundle.assets).toEqual([
      { path: 'public/assets/3d/lens.glb', url: 'https://cdn.test/lens.glb' },
    ]);
    expect(bundle.missingAssets).toEqual([{ component: 'Fluid Glass', refPath: '/assets/3d/bar.glb' }]);
  });

  it('dedupes the same asset referenced by multiple components', () => {
    const mk = (name: string) =>
      component({
        name,
        source: "const m = '/assets/3d/lens.glb';",
        sanitizedArtifact: '<Scene/>',
        assets: [{ refPath: '/assets/3d/lens.glb', url: 'https://cdn.test/lens.glb', filename: 'lens.glb' }],
      });
    const bundle = buildExportBundle([mk('A'), mk('B')]);
    expect(bundle.assets).toHaveLength(1);
  });

  it('empty selection -> explicit empty bundle', () => {
    const bundle = buildExportBundle([]);
    expect(bundle.isEmpty).toBe(true);
    expect(bundle.files).toEqual([]);
  });

  it('is deterministic', () => {
    const input = [component({ name: 'A', sanitizedArtifact: '<a/>' })];
    expect(buildExportBundle(input)).toEqual(buildExportBundle(input));
  });
});
