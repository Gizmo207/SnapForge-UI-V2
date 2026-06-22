'use client';

import { useEffect, useMemo, useState } from 'react';
import { signOut } from 'next-auth/react';
import type { Component } from '@/domains/shared/component';
import type { ViewerProfile } from '@/adapters/auth/session';
import { ComponentCard } from './ComponentCard';
import { PasteModal } from './PasteModal';
import { Sidebar, type Cat } from './Sidebar';

const CAT_ORDER = [
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

function catLabel(slug: string): string {
  return (
    CAT_LABELS[slug] ??
    slug.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
  );
}

export function VaultApp({
  initial,
  userId,
  viewer,
}: {
  initial: Component[];
  userId: string;
  viewer?: ViewerProfile;
}) {
  const [components, setComponents] = useState<Component[]>(initial);
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');

  // Keep the selected category across reloads — refreshing while viewing Navbars
  // should land back on Navbars, not reset to the full vault.
  useEffect(() => {
    const saved = window.localStorage.getItem('sf.activeCat');
    if (saved) setActiveCat(saved);
  }, []);
  useEffect(() => {
    window.localStorage.setItem('sf.activeCat', activeCat);
  }, [activeCat]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }

  // Categories (by subcategory) with counts, ordered canonically — the sidebar
  // groups the vault so cards and toggles aren't jumbled on one page.
  const cats = useMemo<Cat[]>(() => {
    const counts = new Map<string, number>();
    for (const c of components) counts.set(c.subcategory, (counts.get(c.subcategory) ?? 0) + 1);
    return Array.from(counts.entries())
      .map(([slug, count]) => ({ slug, label: catLabel(slug), count }))
      .sort((a, b) => {
        const ia = CAT_ORDER.indexOf(a.slug);
        const ib = CAT_ORDER.indexOf(b.slug);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) || a.label.localeCompare(b.label);
      });
  }, [components]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return components.filter((c) => {
      if (activeCat !== 'all' && c.subcategory !== activeCat) return false;
      if (!q) return true;
      return [c.name, c.framework, c.category, c.subcategory, ...c.tags]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [components, query, activeCat]);

  async function addSnippet(source: string, css?: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, css }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setComponents((prev) => [body.component, ...prev]);
        setModalOpen(false);
      } else {
        setError(body.detail || body.error || `Request failed (${res.status})`);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function setTheme(id: string, theme: 'light' | 'dark') {
    // Optimistic: flip the stage instantly, then persist.
    setComponents((prev) =>
      prev.map((c) => (c.componentId === id ? { ...c, showcaseTheme: theme } : c)),
    );
    try {
      await fetch('/api/components', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, showcaseTheme: theme }),
      });
    } catch {
      /* keep the optimistic state; it re-syncs on next load */
    }
  }

  function applyAsset(id: string, asset: { refPath: string; url: string; filename: string }) {
    setComponents((prev) =>
      prev.map((c) => {
        if (c.componentId !== id) return c;
        const others = (c.assets ?? []).filter((a) => a.refPath !== asset.refPath);
        return { ...c, assets: [...others, asset] };
      }),
    );
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function removeComponent(id: string, name: string) {
    if (!window.confirm(`Delete “${name}” from your vault? This can’t be undone.`)) return;
    // Optimistic: drop it immediately, restore on failure.
    const snapshot = components;
    setComponents((prev) => prev.filter((c) => c.componentId !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    try {
      const res = await fetch(`/api/components?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      flash(`Deleted “${name}”`);
    } catch {
      setComponents(snapshot);
      flash('Delete failed — restored');
    }
  }

  async function exportSelected() {
    if (selected.size === 0 || exporting) return;
    setExporting(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        flash(body.detail || body.error || 'Export failed');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'snapforge-export.zip';
      a.click();
      URL.revokeObjectURL(url);
      flash(`Exported ${selected.size} component${selected.size === 1 ? '' : 's'} ↓`);
    } catch (e) {
      flash((e as Error).message || 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  const displayName = viewer?.name || viewer?.email || null;
  const avatarLetter = (displayName ?? 'You').charAt(0).toUpperCase();

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
          ＋ Add component
        </button>
        <button
          className="btn"
          disabled={selected.size === 0 || exporting}
          onClick={exportSelected}
          title={selected.size ? `Export ${selected.size} selected` : 'Select components to export'}
        >
          {exporting ? '⏳ Bundling…' : `⬇ Export${selected.size ? ` (${selected.size})` : ''}`}
        </button>
        <div className="usermenu">
          <button
            className="avatar"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {viewer?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={viewer.image} alt="" />
            ) : (
              avatarLetter
            )}
          </button>
          {menuOpen && (
            <>
              <div className="menu-scrim" onClick={() => setMenuOpen(false)} />
              <div className="menu" role="menu">
                <div className="menu-id">
                  <span className="menu-name">{displayName ?? 'Signed in'}</span>
                  {viewer?.email && viewer.email !== displayName && (
                    <span className="menu-sub">{viewer.email}</span>
                  )}
                </div>
                <button className="menu-item" role="menuitem" onClick={() => signOut()}>
                  ⇥ Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="layout">
        <Sidebar cats={cats} total={components.length} active={activeCat} onSelect={setActiveCat} />

        <main className="app-main">
          <div className="section-head">
            <h2>{activeCat === 'all' ? 'Your vault' : catLabel(activeCat)}</h2>
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
                  onSetTheme={(theme) => setTheme(c.componentId, theme)}
                  onAssetUploaded={(asset) => applyAsset(c.componentId, asset)}
                  onDelete={() => removeComponent(c.componentId, c.name)}
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
                  : activeCat !== 'all'
                    ? 'No components in this category yet.'
                    : 'Try a different search term.'}
              </p>
              {components.length === 0 && (
                <button className="btn btn-primary btn-lg" onClick={() => setModalOpen(true)}>
                  ＋ Add your first component
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {modalOpen && (
        <PasteModal
          busy={busy}
          error={error}
          onClose={() => {
            setModalOpen(false);
            setError(null);
          }}
          onSubmit={addSnippet}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
