import { describe, it, expect } from 'vitest';
import { looksLikeOnlyCss } from './looksLikeCss';

describe('looksLikeOnlyCss', () => {
  it('flags a bare stylesheet (the ProfileCard.css mistake)', () => {
    const css = `:root {\n  --pointer-x: 50%;\n  --card-opacity: 0;\n}\n.pc-card {\n  border-radius: 30px;\n}\n@keyframes glow { to { opacity: 1; } }`;
    expect(looksLikeOnlyCss(css)).toBe(true);
  });

  it('does not flag a React component (has imports/JSX)', () => {
    const jsx = `import React from 'react';\nexport default function Card() {\n  return <div className="card">hi</div>;\n}`;
    expect(looksLikeOnlyCss(jsx)).toBe(false);
  });

  it('does not flag an HTML snippet', () => {
    expect(looksLikeOnlyCss('<div class="card"><p>Hi</p></div>')).toBe(false);
  });

  it('does not flag styled-components CSS-in-JS', () => {
    const sc = `import styled from 'styled-components';\nconst Box = styled.div\`\n  color: red;\n\`;`;
    expect(looksLikeOnlyCss(sc)).toBe(false);
  });

  it('ignores empty input', () => {
    expect(looksLikeOnlyCss('   ')).toBe(false);
  });
});
