import { describe, it, expect } from 'vitest';
import { usesTailwind, worksOnBoth, usesPrivateClassSyntax, fillsStage, isThemeToggler } from './showcase';
import type { Component } from '@/domains/shared/component';

describe('isThemeToggler', () => {
  it('detects view-transition and dark-class theme togglers', () => {
    expect(isThemeToggler(asComponent('document.startViewTransition(() => {})'))).toBe(true);
    expect(isThemeToggler(asComponent('document.documentElement.classList.toggle("dark")'))).toBe(true);
    expect(isThemeToggler(asComponent('el.setAttribute("data-theme", "dark")'))).toBe(true);
  });
  it('is false for ordinary components', () => {
    expect(isThemeToggler(asComponent('export function Button(){ return <button/>; }'))).toBe(false);
  });
});

const asComponent = (source: string) => ({ source }) as unknown as Component;

describe('fillsStage', () => {
  it('fills for R3F, raw WebGL, and OGL/three library scenes', () => {
    expect(fillsStage(asComponent('<Canvas><mesh/></Canvas>'))).toBe(true);
    expect(fillsStage(asComponent("const gl = canvas.getContext('webgl2', { antialias: true });"))).toBe(true);
    expect(fillsStage(asComponent('new THREE.WebGLRenderer({ canvas })'))).toBe(true);
    expect(fillsStage(asComponent("import { Renderer, Program } from 'ogl';\nconst renderer = new Renderer();"))).toBe(true);
  });

  it('does not fill for fixed-size DOM, 2d-canvas, or SVG-filter glass components', () => {
    expect(fillsStage(asComponent('<div className="loader" />'))).toBe(false);
    expect(fillsStage(asComponent("const ctx = canvas.getContext('2d');"))).toBe(false);
    // GlassSurface is an SVG-filter panel, not a full-bleed scene — stays centered.
    expect(fillsStage(asComponent('<div style={{ backdropFilter: "url(#glass)" }}><filter/></div>'))).toBe(false);
  });
});

describe('usesPrivateClassSyntax', () => {
  it('detects private methods, fields, and this.# access', () => {
    expect(usesPrivateClassSyntax('class A { #project(pos) { return pos; } }')).toBe(true);
    expect(usesPrivateClassSyntax('class A { #count = 0; }')).toBe(true);
    expect(usesPrivateClassSyntax('this.#init();')).toBe(true);
  });

  it('does not trigger on CSS hex colors in strings', () => {
    expect(usesPrivateClassSyntax("const g = 'linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)';")).toBe(false);
    expect(usesPrivateClassSyntax("const c = '#fff'; const d = '#abcdef';")).toBe(false);
  });
});

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

  it('detects Tailwind inside cn()/clsx (shadcn pattern), not just className="..."', () => {
    expect(
      usesTailwind(`<button className={cn("bg-primary text-primary-foreground rounded-lg px-4 py-2", className)}>x</button>`),
    ).toBe(true);
  });

  it('returns false when there are no class attributes', () => {
    expect(usesTailwind(`const x = 1; <div />`)).toBe(false);
  });
});
