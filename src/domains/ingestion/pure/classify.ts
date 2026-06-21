export type Classification = {
  category: string;
  subcategory: string;
  tags: string[];
};

type Rule = {
  pattern: RegExp | ((code: string) => boolean);
  category: string;
  subcategory: string;
  tag: string;
  priority: number;
};

/**
 * Priority-ordered classification rules. Structural rules (a form containing an
 * input; an input/button as the root element) outrank keyword rules. The
 * highest-priority matching rule wins; classification is total, falling back to
 * `components / misc`. Ported and tightened from SnapForge v1.
 */
const rules: Rule[] = [
  // Author intent (highest priority): the declared component name is the most
  // reliable signal — `const Checkbox` vs `const Switch` — because the keywords
  // "toggle"/"switch"/"checkbox" all leak into each other's class names.
  { pattern: (c) => /(?:function|const|class)\s+[A-Za-z0-9_]*Checkbox/i.test(c), category: 'primitives', subcategory: 'checkboxes', tag: 'checkbox', priority: 25 },
  { pattern: (c) => /(?:function|const|class)\s+[A-Za-z0-9_]*(?:Toggle|Switch)/i.test(c), category: 'primitives', subcategory: 'toggles', tag: 'toggle', priority: 24 },

  // Structural detection (high priority)
  { pattern: (c) => /<form/i.test(c) && /<input/i.test(c), category: 'patterns', subcategory: 'forms', tag: 'form', priority: 20 },
  { pattern: (c) => c.trim().startsWith('<input'), category: 'primitives', subcategory: 'inputs', tag: 'input', priority: 19 },
  { pattern: (c) => c.trim().startsWith('<button'), category: 'primitives', subcategory: 'buttons', tag: 'button', priority: 18 },

  // Checkboxes
  { pattern: /input.*type=["']checkbox["']/i, category: 'primitives', subcategory: 'checkboxes', tag: 'checkbox', priority: 11 },
  { pattern: /checkbox/i, category: 'primitives', subcategory: 'checkboxes', tag: 'checkbox', priority: 10 },
  { pattern: /checkmark/i, category: 'primitives', subcategory: 'checkboxes', tag: 'checkbox', priority: 8 },

  // Toggles. A toggle/switch is almost always built as a styled
  // <input type="checkbox">, so these must outrank the checkbox-input rule
  // (priority 11) — otherwise every toggle is mislabeled as a checkbox.
  { pattern: /toggle|\bslider\b/i, category: 'primitives', subcategory: 'toggles', tag: 'toggle', priority: 14 },
  { pattern: /switch/i, category: 'primitives', subcategory: 'toggles', tag: 'toggle', priority: 13 },

  // Radios
  { pattern: /input.*type=["']radio["']/i, category: 'primitives', subcategory: 'radio-buttons', tag: 'radio', priority: 11 },
  { pattern: /radio/i, category: 'primitives', subcategory: 'radio-buttons', tag: 'radio', priority: 10 },

  // Inputs
  { pattern: /input.*type=["']search["']/i, category: 'primitives', subcategory: 'inputs', tag: 'input', priority: 12 },
  { pattern: /input.*placeholder=["'][^"']*search/i, category: 'primitives', subcategory: 'inputs', tag: 'input', priority: 12 },
  { pattern: /input.*type=["'](?:password|email|number|url|tel)["']/i, category: 'primitives', subcategory: 'inputs', tag: 'input', priority: 8 },
  { pattern: /<textarea/i, category: 'primitives', subcategory: 'inputs', tag: 'textarea', priority: 8 },
  { pattern: /placeholder/i, category: 'primitives', subcategory: 'inputs', tag: 'input', priority: 4 },
  { pattern: /<input/i, category: 'primitives', subcategory: 'inputs', tag: 'input', priority: 3 },

  // Buttons
  { pattern: /role=["']button["']/i, category: 'primitives', subcategory: 'buttons', tag: 'button', priority: 9 },
  { pattern: /<button/i, category: 'primitives', subcategory: 'buttons', tag: 'button', priority: 8 },
  { pattern: /\.btn\b|class=["'][^"']*\bbtn\b/i, category: 'primitives', subcategory: 'buttons', tag: 'button', priority: 7 },
  { pattern: /button/i, category: 'primitives', subcategory: 'buttons', tag: 'button', priority: 6 },

  // Loaders
  { pattern: /loader/i, category: 'primitives', subcategory: 'loaders', tag: 'loader', priority: 9 },
  { pattern: /spinner/i, category: 'primitives', subcategory: 'loaders', tag: 'loader', priority: 9 },
  { pattern: /loading/i, category: 'primitives', subcategory: 'loaders', tag: 'loader', priority: 7 },
  { pattern: /skeleton/i, category: 'primitives', subcategory: 'loaders', tag: 'skeleton', priority: 7 },
  { pattern: /progress/i, category: 'primitives', subcategory: 'loaders', tag: 'progress', priority: 6 },

  // Badges
  { pattern: /badge/i, category: 'primitives', subcategory: 'badges', tag: 'badge', priority: 8 },
  { pattern: /chip/i, category: 'primitives', subcategory: 'badges', tag: 'badge', priority: 7 },

  // Tooltips
  { pattern: /tooltip/i, category: 'primitives', subcategory: 'tooltips', tag: 'tooltip', priority: 9 },
  { pattern: /popover/i, category: 'primitives', subcategory: 'tooltips', tag: 'popover', priority: 8 },

  // Cards
  { pattern: /card/i, category: 'components', subcategory: 'cards', tag: 'card', priority: 7 },
  { pattern: /tile/i, category: 'components', subcategory: 'cards', tag: 'card', priority: 5 },
  { pattern: /panel/i, category: 'components', subcategory: 'cards', tag: 'card', priority: 4 },

  // Modals
  { pattern: /modal/i, category: 'components', subcategory: 'modals', tag: 'modal', priority: 8 },
  { pattern: /dialog/i, category: 'components', subcategory: 'modals', tag: 'dialog', priority: 7 },
  { pattern: /overlay/i, category: 'components', subcategory: 'modals', tag: 'modal', priority: 5 },

  // Dropdowns
  { pattern: /dropdown/i, category: 'components', subcategory: 'dropdowns', tag: 'dropdown', priority: 8 },
  { pattern: /select.*option/i, category: 'components', subcategory: 'dropdowns', tag: 'select', priority: 5 },
  { pattern: /menu/i, category: 'components', subcategory: 'dropdowns', tag: 'menu', priority: 4 },

  // Accordions
  { pattern: /accordion/i, category: 'components', subcategory: 'accordions', tag: 'accordion', priority: 8 },
  { pattern: /collapsible/i, category: 'components', subcategory: 'accordions', tag: 'accordion', priority: 7 },

  // Tabs
  { pattern: /tab-/i, category: 'components', subcategory: 'tabs', tag: 'tabs', priority: 7 },
  { pattern: /\.tabs?\b/i, category: 'components', subcategory: 'tabs', tag: 'tabs', priority: 5 },

  // Navigation
  { pattern: /navbar/i, category: 'patterns', subcategory: 'navbars', tag: 'navigation', priority: 9 },
  { pattern: /<nav/i, category: 'patterns', subcategory: 'navbars', tag: 'navigation', priority: 8 },
  { pattern: /sidebar/i, category: 'patterns', subcategory: 'sidebars', tag: 'sidebar', priority: 8 },

  // Heroes
  { pattern: /hero/i, category: 'patterns', subcategory: 'heroes', tag: 'hero', priority: 8 },

  // Forms
  { pattern: /<form/i, category: 'patterns', subcategory: 'forms', tag: 'form', priority: 9 },
  { pattern: /onSubmit|handleSubmit/i, category: 'patterns', subcategory: 'forms', tag: 'form', priority: 8 },
  { pattern: /login|sign-in|signin/i, category: 'patterns', subcategory: 'forms', tag: 'form', priority: 7 },

  // Headers / footers
  { pattern: /<header/i, category: 'patterns', subcategory: 'headers', tag: 'header', priority: 7 },
  { pattern: /<footer/i, category: 'patterns', subcategory: 'footers', tag: 'footer', priority: 7 },

  // Backgrounds / decorative
  { pattern: /particles?/i, category: 'patterns', subcategory: 'backgrounds', tag: 'particles', priority: 7 },
  { pattern: /aurora/i, category: 'patterns', subcategory: 'backgrounds', tag: 'aurora', priority: 7 },
  { pattern: /pattern/i, category: 'patterns', subcategory: 'backgrounds', tag: 'pattern', priority: 6 },
  { pattern: /background/i, category: 'patterns', subcategory: 'backgrounds', tag: 'background', priority: 5 },

  // Layout
  { pattern: /display:\s*grid/i, category: 'layouts', subcategory: 'grids', tag: 'grid', priority: 3 },
];

// Tag-only rules: they add tags but never change the category.
const tagRules: { pattern: RegExp; tag: string }[] = [
  { pattern: /@keyframes/i, tag: 'animation' },
  { pattern: /animation:/i, tag: 'animation' },
  { pattern: /transition:/i, tag: 'transition' },
  { pattern: /<svg/i, tag: 'icon' },
  { pattern: /hover/i, tag: 'hover' },
  { pattern: /glass/i, tag: 'glass' },
  { pattern: /gradient/i, tag: 'gradient' },
  { pattern: /blur/i, tag: 'blur' },
  { pattern: /shadow/i, tag: 'shadow' },
  { pattern: /3d|perspective|rotateX|rotateY/i, tag: '3d' },
  { pattern: /neon|glow/i, tag: 'neon' },
  { pattern: /glitch/i, tag: 'glitch' },
  { pattern: /pulse|pulsate/i, tag: 'pulse' },
  { pattern: /skeleton/i, tag: 'skeleton' },
];

export function classify(code: string): Classification {
  const matched: Rule[] = [];

  for (const rule of rules) {
    const hit = rule.pattern instanceof RegExp ? rule.pattern.test(code) : rule.pattern(code);
    if (hit) matched.push(rule);
  }

  // Stable: highest priority wins; ties keep declaration order.
  matched.sort((a, b) => b.priority - a.priority);

  const best = matched[0];
  const category = best?.category ?? 'components';
  const subcategory = best?.subcategory ?? 'misc';

  const tags = new Set<string>();
  for (const rule of matched) tags.add(rule.tag);
  for (const rule of tagRules) {
    if (rule.pattern.test(code)) tags.add(rule.tag);
  }

  // Keep the cross-tag clean: a toggle isn't a checkbox and vice-versa.
  if (subcategory === 'toggles') tags.delete('checkbox');
  if (subcategory === 'checkboxes') tags.delete('toggle');

  return { category, subcategory, tags: Array.from(tags).sort() };
}
