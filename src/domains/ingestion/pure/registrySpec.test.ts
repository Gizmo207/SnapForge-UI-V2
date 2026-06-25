import { describe, it, expect } from 'vitest';
import {
  parseRegistryInput,
  refToUrl,
  resolveDependencyUrl,
  placeRegistryFile,
  extractRegistryItem,
  asRegistryItem,
} from './registrySpec';

describe('parseRegistryInput', () => {
  it('extracts refs from a shadcn CLI command', () => {
    expect(parseRegistryInput('npx shadcn@latest add @magicui/marquee')).toEqual([
      '@magicui/marquee',
    ]);
    expect(parseRegistryInput('pnpm dlx shadcn add button card')).toEqual(['button', 'card']);
    expect(parseRegistryInput('bunx --bun shadcn@latest add @aceternity/3d-card')).toEqual([
      '@aceternity/3d-card',
    ]);
  });

  it('drops CLI flags', () => {
    expect(parseRegistryInput('npx shadcn add --yes -o @shadcn/button')).toEqual([
      '@shadcn/button',
    ]);
  });

  it('accepts a bare registry .json URL', () => {
    expect(parseRegistryInput('https://magicui.design/r/marquee.json')).toEqual([
      'https://magicui.design/r/marquee.json',
    ]);
  });

  it('accepts a full URL passed to the add command', () => {
    expect(parseRegistryInput('npx shadcn add https://ui.aceternity.com/registry/x.json')).toEqual([
      'https://ui.aceternity.com/registry/x.json',
    ]);
  });

  it('returns null for ordinary source code', () => {
    expect(parseRegistryInput('export default function Btn(){ return <button/> }')).toBeNull();
    expect(parseRegistryInput('')).toBeNull();
  });
});

describe('refToUrl', () => {
  it('passes full URLs through', () => {
    expect(refToUrl('https://x.com/r/a.json')).toBe('https://x.com/r/a.json');
  });
  it('maps known namespaces', () => {
    expect(refToUrl('@magicui/marquee')).toBe('https://magicui.design/r/marquee.json');
    expect(refToUrl('@aceternity/3d-card')).toBe('https://ui.aceternity.com/registry/3d-card.json');
  });
  it('defaults a bare name to the shadcn registry', () => {
    expect(refToUrl('button')).toBe('https://ui.shadcn.com/r/button.json');
  });
  it('returns null for an unknown namespace', () => {
    expect(refToUrl('@nope/thing')).toBeNull();
  });
});

describe('resolveDependencyUrl', () => {
  it('resolves a bare dep against the parent registry directory', () => {
    expect(resolveDependencyUrl('utils', 'https://magicui.design/r/marquee.json')).toBe(
      'https://magicui.design/r/utils.json',
    );
  });
  it('keeps full-URL deps', () => {
    expect(resolveDependencyUrl('https://x.com/r/a.json', 'https://y.com/r/b.json')).toBe(
      'https://x.com/r/a.json',
    );
  });
});

describe('placeRegistryFile', () => {
  it('places a registry:ui file under components/ui', () => {
    expect(placeRegistryFile({ path: 'marquee.tsx', type: 'registry:ui' })).toBe(
      'components/ui/marquee.tsx',
    );
  });
  it('places a registry:lib file under lib', () => {
    expect(placeRegistryFile({ path: 'utils.ts', type: 'registry:lib' })).toBe('lib/utils.ts');
  });
  it('keeps an already-namespaced path and strips a src/ root', () => {
    expect(placeRegistryFile({ path: 'src/components/ui/button.tsx', type: 'registry:ui' })).toBe(
      'components/ui/button.tsx',
    );
  });
});

describe('extractRegistryItem', () => {
  it('keeps only files with inline content and records deps', () => {
    const item = {
      name: 'marquee',
      dependencies: ['clsx'],
      registryDependencies: ['utils'],
      files: [
        { path: 'marquee.tsx', type: 'registry:ui', content: 'export const Marquee = () => null;' },
        { path: 'empty.tsx', type: 'registry:ui' }, // no content -> skipped
        'index-only-string', // legacy entry -> skipped
      ],
    };
    const out = extractRegistryItem(item);
    expect(Object.keys(out.files)).toEqual(['components/ui/marquee.tsx']);
    expect(out.dependencies).toEqual(['clsx']);
    expect(out.registryDependencies).toEqual(['utils']);
  });
});

describe('asRegistryItem', () => {
  it('accepts an object with a files array', () => {
    expect(asRegistryItem({ files: [] })).not.toBeNull();
  });
  it('rejects non-registry payloads', () => {
    expect(asRegistryItem({ hello: 1 })).toBeNull();
    expect(asRegistryItem('<html>')).toBeNull();
    expect(asRegistryItem(null)).toBeNull();
  });
});
