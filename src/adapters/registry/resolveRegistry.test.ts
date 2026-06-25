import { describe, it, expect } from 'vitest';
import { resolveRegistry, looksLikeRegistryInput } from './resolveRegistry';

/** A fake registry: url -> item JSON. */
function fakeFetcher(db: Record<string, unknown>) {
  return async (url: string) => {
    if (!(url in db)) throw new Error('404');
    return db[url];
  };
}

describe('looksLikeRegistryInput', () => {
  it('detects CLI commands and URLs, ignores source', () => {
    expect(looksLikeRegistryInput('npx shadcn add @magicui/marquee')).toBe(true);
    expect(looksLikeRegistryInput('https://x.com/r/a.json')).toBe(true);
    expect(looksLikeRegistryInput('const x = 1')).toBe(false);
  });
});

describe('resolveRegistry', () => {
  it('resolves an item and pulls its registryDependencies recursively', async () => {
    const db = {
      'https://magicui.design/r/marquee.json': {
        name: 'marquee',
        dependencies: ['clsx'],
        registryDependencies: ['utils'],
        files: [
          {
            path: 'marquee.tsx',
            type: 'registry:ui',
            content: 'import { cn } from "@/lib/utils";\nexport const Marquee = () => <div/>;',
          },
        ],
      },
      'https://magicui.design/r/utils.json': {
        name: 'utils',
        files: [
          { path: 'utils.ts', type: 'registry:lib', content: 'export const cn = (...a) => a.join(" ");' },
        ],
      },
    };
    const out = await resolveRegistry('npx shadcn add @magicui/marquee', fakeFetcher(db));
    expect(Object.keys(out.files).sort()).toEqual(['components/ui/marquee.tsx', 'lib/utils.ts']);
    expect(out.dependencies).toContain('clsx');
  });

  it('tolerates a failing transitive dependency but still returns the main files', async () => {
    const db = {
      'https://magicui.design/r/marquee.json': {
        name: 'marquee',
        registryDependencies: ['missing'],
        files: [{ path: 'marquee.tsx', type: 'registry:ui', content: 'export const M = () => null;' }],
      },
      // 'missing' is intentionally absent -> fetch throws, but depth>0 so tolerated
    };
    const out = await resolveRegistry('@magicui/marquee', fakeFetcher(db));
    expect(Object.keys(out.files)).toEqual(['components/ui/marquee.tsx']);
  });

  it('throws a clear error when the seed item is unreachable', async () => {
    await expect(resolveRegistry('@magicui/nope', fakeFetcher({}))).rejects.toThrow(/Couldn’t fetch/);
  });

  it('throws when the payload is not a registry item (e.g. an auth HTML page)', async () => {
    const db = { 'https://ui.shadcn.com/r/button.json': '<html>login</html>' };
    await expect(resolveRegistry('npx shadcn add button', fakeFetcher(db))).rejects.toThrow(
      /registry item/,
    );
  });

  it('rejects input that is not a registry command', async () => {
    await expect(resolveRegistry('just some code', fakeFetcher({}))).rejects.toThrow(
      /registry command or URL/,
    );
  });

  it('de-duplicates a shared dependency across two components', async () => {
    const db = {
      'https://ui.shadcn.com/r/a.json': {
        registryDependencies: ['utils'],
        files: [{ path: 'a.tsx', type: 'registry:ui', content: 'export const A=()=>null;' }],
      },
      'https://ui.shadcn.com/r/b.json': {
        registryDependencies: ['utils'],
        files: [{ path: 'b.tsx', type: 'registry:ui', content: 'export const B=()=>null;' }],
      },
      'https://ui.shadcn.com/r/utils.json': {
        files: [{ path: 'utils.ts', type: 'registry:lib', content: 'export const cn=()=>"";' }],
      },
    };
    const out = await resolveRegistry('npx shadcn add a b', fakeFetcher(db));
    expect(Object.keys(out.files).sort()).toEqual([
      'components/ui/a.tsx',
      'components/ui/b.tsx',
      'lib/utils.ts',
    ]);
  });
});
