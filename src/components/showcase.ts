import type { Component } from '@/domains/shared/component';

export type Showcase = { theme: 'light' | 'dark'; bg: string; fg: string };

// Backgrounds sit a step *off* the near-black page so the card visibly floats,
// the way uiverse's cards do (dark ≈ a lifted charcoal, light ≈ soft grey).
const DARK: Showcase = { theme: 'dark', bg: '#232427', fg: '#f3f3f7' };
const LIGHT: Showcase = { theme: 'light', bg: '#ececf1', fg: '#0f172a' };

const DARK_TAGS = /(dark|neon|glow|cyber|matrix|terminal|night|midnight|space|galaxy|black)/;

/**
 * Showcase height by component kind — like uiverse, where the Cards section uses
 * much taller tiles than Checkboxes/Toggles so the whole component is visible.
 */
export function showcaseHeight(c: Component): number {
  const k = `${c.category} ${c.subcategory}`.toLowerCase();
  // Navbars/heroes are showcase pieces and benefit from a taller stage; most
  // everything else reads best at its natural compact size.
  if (/(navbar|hero|banner)/.test(k)) return 420;
  if (/card/.test(k)) return 400;
  if (/form/.test(k)) return 360;
  return 240;
}

/**
 * Whether a preview only shows its effect once the user moves the cursor over it
 * (cursor trails, pointer-reactive fields). Such a preview looks dead when idle,
 * so we surface a small "move your cursor" hint. Deliberately narrow: ordinary
 * click/hover components (buttons, checkboxes, switches) are obviously
 * interactive and must NOT get the hint.
 */
export function needsInteractionHint(c: Component): boolean {
  return /mousemove|pointermove|onmousemove|onpointermove/i.test(c.source ?? '');
}

// A Tailwind utility token, e.g. flex, bg-black, p-4, rounded-xl, hover:scale-105.
const TW_UTILITY =
  /^(flex|grid|hidden|block|inline-flex|container|relative|absolute|fixed|sticky|bg-\S+|text-\S+|[pm][xytrbl]?-\S+|rounded(?:-\S+)?|[wh]-\S+|gap-\S+|(?:items|justify|content|self)-\S+|(?:hover|focus|active|group-hover|md|lg|xl|sm|dark):\S+|space-[xy]-\S+|font-(?:bold|semibold|medium|light)|shadow(?:-\S+)?|border(?:-\S+)?|opacity-\d+|transition(?:-\S+)?|duration-\d+|scale-\d+|translate-\S+)$/;

/**
 * Detects whether a snippet relies on Tailwind utility classes. We look ONLY
 * inside className/class attributes (so CSS-in-JS like styled-components, whose
 * class names are semantic, never false-positives) and require ≥2 distinct
 * utility tokens. When true, the preview injects the Tailwind runtime.
 */
export function usesTailwind(code: string): boolean {
  const attrs = code.match(/class(?:Name)?=["'][^"']+["']/g);
  if (!attrs) return false;
  let hits = 0;
  for (const attr of attrs) {
    const value = attr.replace(/^class(?:Name)?=["']/, '').replace(/["']$/, '');
    for (const token of value.split(/\s+/)) {
      if (TW_UTILITY.test(token)) {
        hits += 1;
        if (hits >= 2) return true;
      }
    }
  }
  return false;
}

/**
 * Whether a component looks good on EITHER background — true when it paints its
 * own opaque backdrop (a real container background, not a tiny `:before` accent
 * or a translucent fill). Such components are theme-agnostic, so the light/dark
 * toggle stays available. Components without a backdrop depend on the stage for
 * contrast and are locked to their best theme (toggle hidden).
 */
export function worksOnBoth(code: string): boolean {
  const blocks = code.match(/[^{}]+\{[^{}]*\}/g);
  if (!blocks) return false;
  for (const block of blocks) {
    const brace = block.indexOf('{');
    const selector = block.slice(0, brace);
    if (/::?(before|after)/i.test(selector)) continue; // pseudo-element accents
    const body = block.slice(brace);
    const bg = body.match(/background(?:-color)?\s*:\s*([^;}]+)/i);
    if (!bg) continue;
    const value = bg[1].toLowerCase().trim();
    if (!value || value === 'none' || value === 'transparent') continue;
    if (value.includes('var(')) continue; // unknown — often a translucent token
    if (/rgba?\([^)]*,\s*0?\.\d+\s*\)/.test(value)) continue; // translucent
    return true; // an opaque backdrop on a real container
  }
  return false;
}

/** Relative luminance (0 = black, 1 = white) of the first color found, or null. */
function luminance(value: string): number | null {
  let r: number, g: number, b: number;
  const hex = value.match(/#([0-9a-f]{3}|[0-9a-f]{6})\b/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  } else {
    const m = value.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
    if (!m) return null;
    [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
  }
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * Picks the showcase background that makes a component look its best.
 *
 *  1. An explicit per-card override (set by the user) always wins.
 *  2. Otherwise we infer the component's intended theme from its own code:
 *     a dark self-background, or light text, means it was built for a dark
 *     stage; a light self-background or dark text means a light stage.
 *  3. Failing any signal, we default to a light stage — which, on our dark
 *     page, yields the mixed light/dark grid uiverse has.
 */
export function pickShowcase(c: Component): Showcase {
  if (c.showcaseTheme === 'dark') return DARK;
  if (c.showcaseTheme === 'light') return LIGHT;

  if (DARK_TAGS.test(c.tags.join(' ').toLowerCase())) return DARK;

  const src = c.source ?? '';
  const bg = src.match(/background(?:-color)?\s*:\s*([^;{}]+)/i);
  if (bg) {
    const l = luminance(bg[1]);
    if (l !== null) return l < 0.4 ? DARK : LIGHT;
  }
  const color = src.match(/(?:^|[^-])color\s*:\s*([^;{}]+)/i);
  if (color) {
    const l = luminance(color[1]);
    if (l !== null) return l > 0.6 ? DARK : LIGHT;
  }
  return LIGHT;
}
