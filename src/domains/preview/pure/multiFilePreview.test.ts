import { describe, it, expect } from 'vitest';
import { relSpecifier, resolveAliases, assembleMultiFilePreview } from './multiFilePreview';

describe('multiFilePreview', () => {
  it('relSpecifier computes relative imports without code extensions', () => {
    expect(relSpecifier('/components/ui/x.tsx', '/lib/utils.ts')).toBe('../../lib/utils');
    expect(relSpecifier('/components/ui/x.tsx', '/components/ui/button.tsx')).toBe('./button');
    expect(relSpecifier('/index.tsx', '/components/ui/x.tsx')).toBe('./components/ui/x');
    expect(relSpecifier('/index.tsx', '/styles.css')).toBe('./styles.css'); // css keeps ext
  });

  it('rewrites @/ aliases to relative paths when the target file exists', () => {
    const files = {
      '/components/ui/x.tsx': 'import { cn } from "@/lib/utils";\nexport function X(){ return null; }',
      '/lib/utils.ts': 'export function cn(){ return ""; }',
    };
    const out = resolveAliases(files);
    expect(out['/components/ui/x.tsx']).toContain('from "../../lib/utils"');
    expect(out['/components/ui/x.tsx']).not.toContain('@/lib/utils');
  });

  it('leaves an alias alone (for the cn shim) when its target is missing', () => {
    const files = { '/x.tsx': 'import { cn } from "@/lib/utils";\nexport function X(){ return null; }' };
    const out = assembleMultiFilePreview(files, '/x.tsx');
    // cn shim provided, import rewritten to it, default export added for mount
    expect(out.files['/lib/cn.ts']).toContain('export function cn');
    expect(out.files['/x.tsx']).toContain(`'./lib/cn'`);
    expect(out.files['/x.tsx']).toContain('export default X;');
    expect(out.cnShimmed).toBe(true);
    expect(out.unresolved).toEqual([]);
  });

  it('mounts a demo when present and reports it via mountSpecifier', () => {
    const files = {
      '/components/ui/gauge.tsx': 'export function Gauge(){ return null; }',
      '/components/ui/gauge.demo.tsx':
        'import { Gauge } from "@/components/ui/gauge";\nexport function GaugeDemo(){ return <Gauge/>; }',
    };
    const out = assembleMultiFilePreview(files, '/components/ui/gauge.tsx');
    expect(out.mountSpecifier).toBe('./components/ui/gauge.demo');
    // demo's alias import of the component resolved to a relative path
    expect(out.files['/components/ui/gauge.demo.tsx']).toContain('from "./gauge"');
    expect(out.files['/components/ui/gauge.demo.tsx']).toContain('export default GaugeDemo;');
  });
});
