'use client';

import { useMemo, useState } from 'react';
import { signOut } from 'next-auth/react';
import type { Component } from '@/domains/shared/component';
import { ComponentCard } from './ComponentCard';
import { PasteModal } from './PasteModal';

export function VaultApp({ initial, userId }: { initial: Component[]; userId: string }) {
  const [components, setComponents] = useState<Component[]>(initial);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
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

  async function addSnippet(source: string) {
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
        setModalOpen(false);
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

  const avatarLetter = (userId.split(':')[1] ?? userId).charAt(0).toUpperCase();

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          <span>
            Snap<span className="grad">Forge</span>
          </span>
        </div>
        <div className="search">
          <span aria-hidden>🔍</span>
          <input
            type="search"
            placeholder="Search by name, framework, category, or tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="topbar-spacer" />
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          ＋ Paste snippet
        </button>
        <button className="btn" disabled={selected.size === 0} onClick={exportSelected}>
          ⬇ Export{selected.size ? ` (${selected.size})` : ''}
        </button>
        <div className="userchip">
          <span className="avatar">{avatarLetter}</span>
        </div>
        <button className="icon-btn" title="Sign out" onClick={() => signOut()} aria-label="Sign out">
          ⎋
        </button>
      </header>

      <main className="app-main">
        <div className="section-head">
          <h2>Your vault</h2>
          <span className="count">
            {filtered.length} component{filtered.length === 1 ? '' : 's'}
            {query && ` · filtered`}
          </span>
        </div>

        {filtered.length > 0 ? (
          <div className="grid">
            {filtered.map((c) => (
              <ComponentCard
                key={c.componentId}
                component={c}
                selected={selected.has(c.componentId)}
                onToggle={() => toggle(c.componentId)}
              />
            ))}
          </div>
        ) : (
          <div className="empty">
            <div className="empty-mark" style={{ fontSize: 26 }}>
              📦
            </div>
            <h3>{components.length === 0 ? 'Your vault is empty' : 'No matches'}</h3>
            <p>
              {components.length === 0
                ? 'Paste your first React or HTML component — it’ll be classified, sandboxed, and saved here.'
                : 'Try a different search term.'}
            </p>
            {components.length === 0 && (
              <button className="btn btn-primary btn-lg" onClick={() => setModalOpen(true)}>
                ＋ Paste your first snippet
              </button>
            )}
          </div>
        )}
      </main>

      {modalOpen && (
        <PasteModal busy={busy} onClose={() => setModalOpen(false)} onSubmit={addSnippet} />
      )}
    </>
  );
}
