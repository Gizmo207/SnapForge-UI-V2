'use client';

import { useMemo, useState } from 'react';
import type { Component } from '@/domains/shared/component';
import { PreviewSandbox } from './PreviewSandbox';

/**
 * Gallery + search UI. Displays the taxonomy and collects selection/paste intent
 * — it owns no decisions (classification and gate outcomes are persisted).
 */
export function Gallery({ initial }: { initial: Component[] }) {
  const [components, setComponents] = useState<Component[]>(initial);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return components;
    return components.filter((c) =>
      [c.name, c.framework, c.category, c.subcategory, ...c.tags]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [components, query]);

  async function paste() {
    const source = window.prompt('Paste a React or HTML snippet:');
    if (!source) return;
    setBusy(true);
    try {
      const res = await fetch('/api/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      });
      if (res.ok) {
        const { component } = await res.json();
        setComponents((prev) => [component, ...prev]);
      }
    } finally {
      setBusy(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function exportSelected() {
    if (selected.size === 0) return;
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snapforge-export.zip';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="gallery">
      <header className="gallery-bar">
        <input
          type="search"
          placeholder="Search name, framework, category, tag…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={paste} disabled={busy}>
          {busy ? 'Capturing…' : 'Paste snippet'}
        </button>
        <button onClick={exportSelected} disabled={selected.size === 0}>
          Export ({selected.size})
        </button>
      </header>

      <div className="gallery-grid">
        {filtered.map((c) => (
          <article key={c.componentId} className="card" data-outcome={c.sanitizationOutcome}>
            <div className="card-head">
              <input
                type="checkbox"
                checked={selected.has(c.componentId)}
                onChange={() => toggle(c.componentId)}
                aria-label={`select ${c.name}`}
              />
              <h3>{c.name}</h3>
              <span className="meta">
                {c.framework} · {c.category}/{c.subcategory}
              </span>
            </div>
            <PreviewSandbox component={c} />
            {c.tags.length > 0 && <div className="tags">{c.tags.join(' · ')}</div>}
          </article>
        ))}
        {filtered.length === 0 && <p className="empty">No components yet. Paste one.</p>}
      </div>
    </div>
  );
}
