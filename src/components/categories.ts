// The canonical category list and labels, shared by the sidebar, the vault, and
// the per-card "move to category" control so they never drift apart.

export const CAT_ORDER = [
  'buttons', 'checkboxes', 'toggles', 'radio-buttons', 'inputs', 'forms',
  'cards', 'loaders', 'badges', 'tooltips', 'modals', 'dropdowns',
  'accordions', 'tabs', 'navbars', 'sidebars', 'heroes', 'headers',
  'footers', 'backgrounds', 'grids', 'misc',
];

const CAT_LABELS: Record<string, string> = {
  toggles: 'Toggle switches',
  'radio-buttons': 'Radio buttons',
  misc: 'Other',
};

export function catLabel(slug: string): string {
  return (
    CAT_LABELS[slug] ??
    slug.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
  );
}
