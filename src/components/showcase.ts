import type { Component } from '@/domains/shared/component';

export type Showcase = { theme: 'light' | 'dark'; bg: string; fg: string };

const DARK = /(dark|neon|glow|cyber|matrix|terminal|night|midnight|space|galaxy|black)/;

/**
 * Picks a showcase background that makes the component look its best — a clean
 * light surface by default, or a dark one when the component reads as dark/neon.
 * (Ported from v1's preview-theme heuristic.)
 */
export function pickShowcase(c: Component): Showcase {
  const hay = `${c.tags.join(' ')} ${c.source ?? ''}`.toLowerCase();
  const darkBg = /background[^;]*:\s*(#0|#1[0-9a-f]|rgb\(\s*[0-3]?\d\s*,)/.test(hay);
  if (DARK.test(c.tags.join(' ')) || darkBg) {
    return { theme: 'dark', bg: '#0e0e15', fg: '#f3f3f7' };
  }
  return { theme: 'light', bg: '#edeef2', fg: '#0f172a' };
}
