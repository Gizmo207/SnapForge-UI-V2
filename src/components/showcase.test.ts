import { describe, it, expect } from 'vitest';
import { usesTailwind } from './showcase';

describe('usesTailwind', () => {
  it('detects Tailwind utility classes', () => {
    expect(
      usesTailwind(`<div className="flex items-center bg-black rounded-xl p-4">hi</div>`),
    ).toBe(true);
  });

  it('detects responsive/state variants', () => {
    expect(usesTailwind(`<button className="hover:scale-105 md:flex">x</button>`)).toBe(true);
  });

  it('does not false-positive on semantic class names (styled-components)', () => {
    expect(
      usesTailwind(`<label className="switch"><div className="toggle-track" /></label>`),
    ).toBe(false);
  });

  it('requires at least two utility tokens', () => {
    expect(usesTailwind(`<div className="card flex">only one utility</div>`)).toBe(false);
  });

  it('returns false when there are no class attributes', () => {
    expect(usesTailwind(`const x = 1; <div />`)).toBe(false);
  });
});
