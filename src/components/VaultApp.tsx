'use client';

import { useEffect, useMemo, useState } from 'react';
import { signOut } from 'next-auth/react';
import type { BackdropId, Component } from '@/domains/shared/component';
import type { ViewerProfile } from '@/adapters/auth/session';
import { ComponentCard } from './ComponentCard';
import { PasteModal } from './PasteModal';
import { McpModal } from './McpModal';
import { Sidebar, type Cat } from './Sidebar';
import { CAT_ORDER, catLabel } from './categories';

export function VaultApp({
  initial,
  userId,
  viewer,
  isPro = false,
}: {
  initial: Component[];
  userId: string;
  viewer?: ViewerProfile;
  isPro?: boolean;
}) {
  const [components, setComponents] = useState<Component[]>(initial);
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  // Tags are cross-cutting attributes (animated, 3d, glass…) — a filter, not a
  // section. Selecting one narrows the current view; switching category clears it.
  const [activeTag, setActiveTag] = useState<string | null>(null);

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
  const [mcpOpen, setMcpOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<{ id: string; name: string } | null>(null);

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }

  // Thank-you after a successful Stripe checkout (success_url adds ?upgraded=1),
  // then strip the query so a refresh doesn't show it again.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === '1') {
      flash('🎉 Welcome to Pro — your MCP server is unlocked. Thank you!');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

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

  // Category + search filter (before the tag filter), so the tag chips reflect
  // what's actually in the current view.
  const byCatQuery = useMemo(() => {
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

  // Most common tags in the current view, as toggle chips.
  const tagBar = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of byCatQuery) for (const t of c.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 14)
      .map(([tag, count]) => ({ tag, count }));
  }, [byCatQuery]);

  // Drop the active tag if it isn't present in the current view (e.g. after
  // switching category), so we never show an empty grid for a stale filter.
  useEffect(() => {
    if (activeTag && !tagBar.some((t) => t.tag === activeTag)) setActiveTag(null);
  }, [tagBar, activeTag]);

  const filtered = useMemo(
    () => (activeTag ? byCatQuery.filter((c) => c.tags.includes(activeTag)) : byCatQuery),
    [byCatQuery, activeTag],
  );

  async function postComponent(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const addSnippet = (source: string, css?: string, demo?: string) =>
    postComponent({ source, css, demo });
  const addFiles = (files: Record<string, string>) => postComponent({ files });
  const addRegistry = (registry: string) => postComponent({ registry });

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

  async function setBackdrop(id: string, backdrop: BackdropId | null) {
    // Optimistic: drop the backdrop instantly, then persist.
    setComponents((prev) =>
      prev.map((c) => (c.componentId === id ? { ...c, backdrop } : c)),
    );
    try {
      await fetch('/api/components', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, backdrop }),
      });
    } catch {
      /* keep the optimistic state; it re-syncs on next load */
    }
  }

  async function setSubcategory(id: string, subcategory: string) {
    // Optimistic: re-file the card instantly (it hops to the new category), then
    // persist. Classification is a best guess; this lets the user correct it.
    setComponents((prev) =>
      prev.map((c) => (c.componentId === id ? { ...c, subcategory } : c)),
    );
    try {
      await fetch('/api/components', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, subcategory }),
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
        <button
          className="btn"
          onClick={() => setMcpOpen(true)}
          title="Connect your vault to an AI agent (Claude Code, Cursor, Windsurf, Hermes…) — generate MCP tokens here"
        >
          🔌 Connect AI · MCP
        </button>
        {isPro && <span className="topbar-pro" title="You're on the Pro plan">✦ PRO</span>}
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
                {isPro ? (
                  <div className="menu-plan">
                    <span className="plan-pill">✦ PRO</span>
                    <span className="plan-note">MCP server unlocked</span>
                  </div>
                ) : null}
                {isPro ? (
                  <button
                    className="menu-item"
                    role="menuitem"
                    onClick={async () => {
                      const res = await fetch('/api/stripe/portal', { method: 'POST' });
                      const body = await res.json().catch(() => ({}));
                      if (body.url) window.location.href = body.url;
                      else setError(body.detail || body.error || 'No billing account yet');
                    }}
                  >
                    ⚙ Settings &amp; billing
                  </button>
                ) : (
                  <button
                    className="menu-item menu-item-accent"
                    role="menuitem"
                    onClick={async () => {
                      const res = await fetch('/api/stripe/checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ plan: 'pro', interval: 'month' }),
                      });
                      const body = await res.json().catch(() => ({}));
                      if (body.url) window.location.href = body.url;
                      else setError(body.detail || body.error || 'Could not start checkout');
                    }}
                  >
                    ✦ Upgrade to Pro
                  </button>
                )}
                {isPro && (
                  <button
                    className="menu-item"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      setMcpOpen(true);
                    }}
                  >
                    🔌 MCP tokens for agents
                  </button>
                )}
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
              {(query || activeTag) && ` · filtered`}
            </span>
          </div>

          {tagBar.length > 1 && (
            <div className="tagbar" role="group" aria-label="Filter by tag">
              <button
                className={`tagchip${activeTag === null ? ' on' : ''}`}
                onClick={() => setActiveTag(null)}
              >
                All
              </button>
              {tagBar.map(({ tag, count }) => (
                <button
                  key={tag}
                  className={`tagchip${activeTag === tag ? ' on' : ''}`}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                >
                  {tag}
                  <span className="tagchip-n">{count}</span>
                </button>
              ))}
            </div>
          )}

          {filtered.length > 0 ? (
            <div className="grid">
              {filtered.map((c) => (
                <ComponentCard
                  key={c.componentId}
                  component={c}
                  selected={selected.has(c.componentId)}
                  onToggle={() => toggle(c.componentId)}
                  onSetTheme={(theme) => setTheme(c.componentId, theme)}
                  onSetBackdrop={(backdrop) => setBackdrop(c.componentId, backdrop)}
                  onSetSubcategory={(sub) => setSubcategory(c.componentId, sub)}
                  onAssetUploaded={(asset) => applyAsset(c.componentId, asset)}
                  onDelete={() => setConfirmDel({ id: c.componentId, name: c.name })}
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
          onSubmitFiles={addFiles}
          onSubmitRegistry={addRegistry}
        />
      )}

      {mcpOpen && <McpModal onClose={() => setMcpOpen(false)} />}

      {confirmDel && (
        <div className="overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Delete component?</h3>
              <button className="icon-btn x" onClick={() => setConfirmDel(null)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="confirm-text">
                Remove <strong>“{confirmDel.name}”</strong> from your vault? This can’t be undone.
              </p>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  const { id, name } = confirmDel;
                  setConfirmDel(null);
                  void removeComponent(id, name);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
