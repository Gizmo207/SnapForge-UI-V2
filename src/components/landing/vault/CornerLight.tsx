'use client';

import styled, { keyframes } from 'styled-components';

/**
 * A soft, warm "sunshine" glow meant to bleed in from a section corner. Pure CSS
 * (a layered radial gradient on `screen` blend) so it's cheap — no canvas/WebGL.
 * Position it with a className (e.g. `-left-40 -top-40`) inside a `relative
 * overflow-hidden` section so it's clipped to the corner.
 */
const breathe = keyframes`
  0%, 100% { opacity: 0.78; transform: scale(1); }
  50%      { opacity: 1;    transform: scale(1.07); }
`;

const Glow = styled.div`
  position: absolute;
  pointer-events: none;
  width: 560px;
  height: 560px;
  border-radius: 50%;
  filter: blur(10px);
  mix-blend-mode: screen;
  background: radial-gradient(
    circle at 32% 32%,
    rgba(255, 236, 186, 0.55) 0%,
    rgba(255, 198, 120, 0.30) 26%,
    rgba(255, 150, 80, 0.13) 47%,
    transparent 70%
  );
  animation: ${breathe} 7s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export default function CornerLight({ className = '' }: { className?: string }) {
  return <Glow className={className} aria-hidden />;
}
