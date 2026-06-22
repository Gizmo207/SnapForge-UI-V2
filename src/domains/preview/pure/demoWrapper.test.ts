import { describe, it, expect } from 'vitest';
import { detectComponentName, cleanDemoSource, buildDemoApp } from './demoWrapper';

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
});
