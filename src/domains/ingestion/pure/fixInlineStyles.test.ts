import { describe, it, expect } from 'vitest';
import { fixInlineStyleVars } from './fixInlineStyles';

describe('fixInlineStyleVars', () => {
  it('quotes and normalizes an unquoted single-dash CSS-var key', () => {
    expect(fixInlineStyleVars(`<label style={{-angle: '-30deg'}}>x</label>`)).toBe(
      `<label style={{'--angle': '-30deg'}}>x</label>`,
    );
    expect(fixInlineStyleVars(`<i style={{-d: '0s'}} />`)).toBe(`<i style={{'--d': '0s'}} />`);
  });

  it('quotes a double-dash key too', () => {
    expect(fixInlineStyleVars(`<i style={{--x: '1px'}} />`)).toBe(`<i style={{'--x': '1px'}} />`);
  });

  it('leaves normal and already-quoted keys alone', () => {
    const ok = `<i style={{ color: 'red', '--y': '2px' }} />`;
    expect(fixInlineStyleVars(ok)).toBe(ok);
  });

  it('does NOT touch CSS custom properties in a styled-components template', () => {
    const css = 'const W = styled.div`\n  :root { --accent: #ff3e3e; }\n  .x { color: var(--accent); }\n`;';
    expect(fixInlineStyleVars(css)).toBe(css);
  });
});
