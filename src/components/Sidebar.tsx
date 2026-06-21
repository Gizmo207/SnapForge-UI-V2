'use client';

export type Cat = { slug: string; label: string; count: number };

const ICONS: Record<string, string> = {
  all: '▦',
  buttons: '🔘',
  checkboxes: '☑️',
  toggles: '🎚️',
  'radio-buttons': '🔘',
  inputs: '⌨️',
  forms: '📝',
  cards: '🃏',
  loaders: '⏳',
  badges: '🏷️',
  tooltips: '💬',
  modals: '🪟',
  dropdowns: '🔽',
  accordions: '📚',
  tabs: '🗂️',
  navbars: '🧭',
  sidebars: '📐',
  heroes: '🦸',
  headers: '🧱',
  footers: '🧱',
  backgrounds: '🌌',
  grids: '▦',
  misc: '📦',
};

export function Sidebar({
  cats,
  total,
  active,
  onSelect,
}: {
  cats: Cat[];
  total: number;
  active: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <aside className="sidebar">
      <nav>
        <button
          className={`side-item${active === 'all' ? ' on' : ''}`}
          onClick={() => onSelect('all')}
        >
          <span className="side-ico">{ICONS.all}</span>
          <span className="side-label">All</span>
          <span className="side-count">{total}</span>
        </button>
        {cats.length > 0 && <div className="side-sep" />}
        {cats.map((c) => (
          <button
            key={c.slug}
            className={`side-item${active === c.slug ? ' on' : ''}`}
            onClick={() => onSelect(c.slug)}
          >
            <span className="side-ico">{ICONS[c.slug] ?? '◦'}</span>
            <span className="side-label">{c.label}</span>
            <span className="side-count">{c.count}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
