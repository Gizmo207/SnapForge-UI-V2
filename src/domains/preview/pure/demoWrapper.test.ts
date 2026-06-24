import { describe, it, expect } from 'vitest';
import { detectComponentName, cleanDemoSource, buildDemoApp, isModuleDemo } from './demoWrapper';

describe('demoWrapper', () => {
  it('detects a default-export name from `export default Name;`', () => {
    expect(detectComponentName('const GlassSurface = () => {};\nexport default GlassSurface;')).toBe(
      'GlassSurface',
    );
  });

  it('detects a name from `export default function Name`', () => {
    expect(detectComponentName('export default function Card() { return null; }')).toBe('Card');
  });

  it('strips imports and comments from a usage snippet', () => {
    const demo = `import GlassSurface from './GlassSurface'\n\n// Basic usage\n<GlassSurface width={300}><h2>Hi</h2></GlassSurface>`;
    const cleaned = cleanDemoSource(demo);
    expect(cleaned).not.toContain('import');
    expect(cleaned).not.toContain('// Basic');
    expect(cleaned).toContain('<GlassSurface');
  });

  it('builds an App that imports the component and renders the usage', () => {
    const code = 'const GlassSurface = () => {};\nexport default GlassSurface;';
    const app = buildDemoApp(code, `<GlassSurface><h2>Hi</h2></GlassSurface>`);
    expect(app).toContain("import GlassSurface from './Component';");
    expect(app).toContain('<GlassSurface><h2>Hi</h2></GlassSurface>');
    expect(app).toContain('export default function App');
  });

  it('returns null when the component name cannot be found', () => {
    expect(buildDemoApp('const x = 1;', '<Foo/>')).toBeNull();
  });

  it('detects named-export components (shadcn)', () => {
    expect(detectComponentName('export function AnimatedCircularProgressBar() {}')).toBe(
      'AnimatedCircularProgressBar',
    );
    expect(detectComponentName('export const Marquee = () => null;')).toBe('Marquee');
  });

  it('classifies bare JSX vs a full component module', () => {
    expect(isModuleDemo('<Comp value={1} onClick={() => x()} />')).toBe(false);
    expect(isModuleDemo('export function Demo(){ const [v]=useState(0); return <Comp value={v}/>; }')).toBe(true);
  });

  it('builds a module demo: rewrites the component import, keeps hooks, adds default export', () => {
    const code = 'export function AnimatedCircularProgressBar(){ return null; }';
    const demo = `"use client"
import { useEffect, useState } from "react"
import { AnimatedCircularProgressBar } from "@/registry/magicui/animated-circular-progress-bar"
export function AnimatedCircularProgressBarDemo() {
  const [value, setValue] = useState(0)
  return <AnimatedCircularProgressBar value={value} gaugePrimaryColor="rgb(79 70 229)" gaugeSecondaryColor="rgba(0,0,0,0.1)" />
}`;
    const app = buildDemoApp(code, demo)!;
    expect(app).toContain(`from './Component'`); // component import rewritten
    expect(app).not.toContain('@/registry'); // alias gone
    expect(app).toContain(`from "react"`); // hooks kept
    expect(app).toContain('export default AnimatedCircularProgressBarDemo;'); // mountable
  });
});
