import { describe, it, expect } from 'vitest';
import { usesTailwind, worksOnBoth } from './showcase';

describe('worksOnBoth (theme lock)', () => {
  it('true when the component paints an opaque container backdrop', () => {
    expect(worksOnBoth(`.card { background-color: #000; border-radius: 8px; }`)).toBe(true);
    expect(worksOnBoth(`.switch { background: black; width: 60px; }`)).toBe(true);
    expect(worksOnBoth(`.box { background: linear-gradient(45deg, #e81cff, #40c9ff); }`)).toBe(true);
  });

  it('false when backgrounds are only on pseudo-element accents (dark-only loader)', () => {
    const css = `.loader:before { background: #2a9d8f; }
      .loader:after { box-shadow: 0 5px 0 #f2f2f2; }`;
    expect(worksOnBoth(css)).toBe(false);
  });

  it('false when the only fill is translucent / a token', () => {
    expect(worksOnBoth(`.spinner > div { background-color: var(--clr-alpha); }`)).toBe(false);
    expect(worksOnBoth(`.x { background: rgba(0,0,0,0.1); }`)).toBe(false);
  });
});

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
