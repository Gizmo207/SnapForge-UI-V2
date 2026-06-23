import type { Component, BackdropId } from '@/domains/shared/component';

export type Showcase = { theme: 'light' | 'dark'; bg: string; fg: string };

/**
 * Preview backdrops the user can drop behind a component so overlay/glass
 * components have something to refract. Each maps to a CSS `background` value
 * painted on the stage (the `<html>` canvas), which the component renders over.
 * `mono`/`mesh` are tasteful gradients; `grid`/`dots` are bold patterns whose
 * hard edges make a glass lens's distortion obvious. Order = the cycle order.
 */
export const BACKDROP_ORDER: BackdropId[] = ['mono', 'mesh', 'grid', 'dots', 'dark'];

const BACKDROP_CSS: Record<BackdropId, string> = {
  mono:
    'radial-gradient(at 18% 22%, #4a4a4a 0, transparent 50%),' +
    'radial-gradient(at 82% 28%, #5e5e5e 0, transparent 50%),' +
    'radial-gradient(at 50% 85%, #2b2b2b 0, transparent 55%), #1b1b1d',
  mesh:
    'radial-gradient(at 15% 20%, #6d28d9 0, transparent 50%),' +
    'radial-gradient(at 82% 25%, #db2777 0, transparent 50%),' +
    'radial-gradient(at 50% 88%, #2563eb 0, transparent 55%), #0b0b14',
  grid:
    'linear-gradient(#ffffff1f 1px, transparent 1px) 0 0/22px 22px,' +
    'linear-gradient(90deg, #ffffff1f 1px, transparent 1px) 0 0/22px 22px, #16161c',
  dots: 'radial-gradient(#ffffff26 1.5px, transparent 1.7px) 0 0/18px 18px, #15151b',
  dark: '#0b0b0e',
};

/** The CSS `background` for a backdrop, or null for the plain stage. */
export function backdropCss(id: BackdropId | null | undefined): string | null {
  return id ? BACKDROP_CSS[id] : null;
}

/** The next backdrop in the cycle (… → last → null/plain → first → …). */
export function nextBackdrop(current: BackdropId | null | undefined): BackdropId | null {
  if (!current) return BACKDROP_ORDER[0];
  const i = BACKDROP_ORDER.indexOf(current);
  return i === -1 || i === BACKDROP_ORDER.length - 1 ? null : BACKDROP_ORDER[i + 1];
}

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
  // Navbars/heroes/backgrounds are full-bleed showcase pieces and read best on a
  // taller stage; most everything else reads best at its natural compact size.
  if (/(navbar|hero|banner|background)/.test(k)) return 420;
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

/**
 * WebGL/3D scenes paint their own background and fill their parent. Scaling them
 * to fit (as we do for fixed-size DOM components) leaves them floating in dead
 * space AND — worse for interactive ones — a CSS `transform: scale()` on the
 * canvas distorts the pointer-to-canvas coordinate math, so dragging flickers
 * and zoom goes haywire. Instead we let these fill the stage edge to edge at 1:1.
 * Covers React-Three-Fiber `<Canvas>` and raw WebGL (e.g. an InfiniteMenu sphere
 * built on `getContext('webgl')`). Plain 2d-canvas loaders are unaffected.
 */
export function fillsStage(c: Component): boolean {
  const src = c.source ?? '';
  return (
    /<Canvas[\s/>]|@react-three\/fiber/i.test(src) ||
    /getContext\(\s*['"]webgl2?['"]/i.test(src) ||
    /new\s+THREE\.WebGLRenderer|WebGLRenderingContext|WebGL2RenderingContext/i.test(src) ||
    // WebGL via a library that hides the raw context: OGL (`new Renderer()`) and
    // three.js. These render full-bleed scenes (e.g. an OGL "Lightfall" pattern)
    // that should fill the stage, not float as a scaled box.
    /from\s+['"]ogl['"]|new\s+Renderer\s*\(|from\s+['"]three['"]/i.test(src)
  );
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
 * Whether the code uses ES2022 class private members (`#method()`, `#field`,
 * `this.#x`). Sandpack's default Babel transform rejects these unless the
 * private-syntax plugins are enabled, so the preview needs a `.babelrc` when this
 * is true. Matched narrowly (a `#name` followed by `(`, `=`, or `;`, or a
 * `this.#` access) so CSS hex colors like `#60496e8c` in template strings don't
 * trigger it. Over-detection would only add unused plugins, so it errs toward
 * matching.
 */
export function usesPrivateClassSyntax(code: string): boolean {
  return /this\.#[A-Za-z_]|#[A-Za-z_]\w*\s*(?:\(|=[^=]|;)/.test(code);
}

/**
 * Whether a component is a glass/overlay surface — it refracts or frosts whatever
 * is painted *behind* it (CSS `backdrop-filter`, an SVG displacement filter, or a
 * "glass" name). Such components look dead over a static stage: their whole point
 * is distorting moving content. The preview gives these an auto-scrolling sample
 * content layer behind them so the effect is actually visible (like the source
 * library's scroll demo).
 */
export function isGlassOverlay(c: Component): boolean {
  const src = `${c.source ?? ''}\n${c.cssSource ?? ''}`;
  // Strong signals only: a glass/frost-named component, or an SVG displacement
  // filter (the distortion technique). Plain `backdrop-filter` is intentionally
  // NOT a trigger — opaque cards (e.g. a profile card) use it for minor effects,
  // and the scrolling content layer is meaningless behind a solid background.
  return /\b(glass|frost(?:ed)?)\b/i.test(c.name ?? '') || /feDisplacementMap/i.test(src);
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
