import { describe, it, expect } from 'vitest';
import { normalizeFiles, stripCommonPrefix, pickEntry, pickDemo, ingestFiles } from './multiFile';

describe('multiFile ingestion', () => {
  it('normalizeFiles keeps text source, drops junk/binaries/tooling', () => {
    const out = normalizeFiles({
      'src/Button.tsx': 'export function Button(){}',
      'package.json': '{}',
      'node_modules/x/index.js': 'junk',
      'logo.png': 'binary',
      'styles.css': '.a{}',
      'tsconfig.json': '{}',
    });
    expect(Object.keys(out).sort()).toEqual(['/src/Button.tsx', '/styles.css']);
  });

  it('stripCommonPrefix removes a shared top folder so aliases sit near root', () => {
    const out = stripCommonPrefix({
      '/my-comp/components/ui/x.tsx': 'a',
      '/my-comp/lib/utils.ts': 'b',
    });
    expect(Object.keys(out).sort()).toEqual(['/components/ui/x.tsx', '/lib/utils.ts']);
  });

  it('picks the non-demo component file as entry', () => {
    const files = {
      '/components/ui/animated-circular-progress-bar.tsx': 'export function AnimatedCircularProgressBar(){ return null; }',
      '/lib/utils.ts': 'export function cn(){ return ""; }',
      '/components/ui/demo.tsx': 'export function Demo(){ return null; }',
    };
    expect(pickEntry(files)).toBe('/components/ui/animated-circular-progress-bar.tsx');
    expect(pickDemo(files, pickEntry(files)!)).toBe('/components/ui/demo.tsx');
  });

  it('ingestFiles classifies from the entry and aggregates deps', () => {
    const r = ingestFiles({
      'progress/components/ui/progress.tsx':
        'import { motion } from "framer-motion";\nimport { cn } from "@/lib/utils";\nexport function ProgressLoader(){ return <div className={cn("x")}/>; }',
      'progress/lib/utils.ts': 'export function cn(){ return ""; }',
    })!;
    expect(r.entry).toBe('/components/ui/progress.tsx');
    expect(r.framework).toBe('react');
    expect(r.name.length).toBeGreaterThan(0);
    expect(r.dependencies).toContain('framer-motion'); // @/lib/utils excluded
    expect(r.dependencies).not.toContain('@/lib');
  });

  it('returns null when there is no usable code', () => {
    expect(ingestFiles({ 'readme.md': '# hi', 'styles.css': '.a{}' })).toBeNull();
  });
});
