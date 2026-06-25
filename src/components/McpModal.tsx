'use client';

import { useEffect, useState } from 'react';

type TokenInfo = { id: string; label: string; createdAt: string; lastUsedAt: string | null };

/**
 * Connect-your-vault-to-an-AI-agent panel. Generates an MCP personal access
 * token (shown once), lists/revokes existing tokens, and shows copy-paste
 * connection snippets for Claude Code / Cursor / Windsurf. The raw token is
 * never persisted in the client beyond the one-time reveal.
 */
export function McpModal({ onClose }: { onClose: () => void }) {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [fresh, setFresh] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mcpUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/mcp` : '/api/mcp';

  async function load() {
    try {
      const res = await fetch('/api/mcp/token');
      const body = await res.json();
      if (res.ok) setTokens(body.tokens ?? []);
    } catch {
      /* non-fatal */
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/mcp/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const body = await res.json();
      if (res.ok) {
        setFresh(body.token);
        void load();
      } else {
        setError(body.detail || body.error || 'Could not create token');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    await fetch(`/api/mcp/token?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    void load();
  }

  const tokenForSnippet = fresh ?? 'YOUR_TOKEN';
  const claudeSnippet = `claude mcp add --transport http snapforge ${mcpUrl} \\\n  --header "Authorization: Bearer ${tokenForSnippet}"`;
  const jsonSnippet = `{
  "mcpServers": {
    "snapforge": {
      "url": "${mcpUrl}",
      "headers": { "Authorization": "Bearer ${tokenForSnippet}" }
    }
  }
}`;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Connect your vault to an AI agent</h3>
          <button className="icon-btn x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-hint" style={{ marginTop: 0 }}>
            Give Claude Code, Cursor, or Windsurf access to your component vault over MCP. Your
            agent can then <strong>search</strong>, <strong>list</strong>, and{' '}
            <strong>pull</strong> your saved components to build with — e.g.{' '}
            <em>“build a landing page using components from my SnapForge vault.”</em> Read-only.
          </p>

          <button className="btn btn-primary btn-sm" disabled={busy} onClick={generate}>
            {busy ? 'Generating…' : '＋ Generate connection token'}
          </button>
          {error && <div className="paste-warn">⚠ {error}</div>}

          {fresh && (
            <div className="css-field" style={{ marginTop: 12 }}>
              <label className="css-label">
                Your new token <span>(copy it now — it won’t be shown again)</span>
              </label>
              <code
                style={{
                  display: 'block',
                  padding: '10px 12px',
                  background: 'var(--input-bg, #14141b)',
                  border: '1px solid var(--border, #2a2a35)',
                  borderRadius: 8,
                  wordBreak: 'break-all',
                  fontSize: 13,
                }}
              >
                {fresh}
              </code>
              <button
                className="link-btn"
                onClick={() => void navigator.clipboard?.writeText(fresh)}
              >
                Copy token
              </button>
            </div>
          )}

          <div className="upload-divider">
            <span>connection snippets</span>
          </div>

          <label className="css-label">Claude Code</label>
          <Snippet text={claudeSnippet} />
          <label className="css-label" style={{ marginTop: 10 }}>
            Cursor / Windsurf (mcp.json)
          </label>
          <Snippet text={jsonSnippet} />

          {tokens.length > 0 && (
            <>
              <div className="upload-divider">
                <span>your tokens</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {tokens.map((t) => (
                  <li
                    key={t.id}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 13 }}
                  >
                    <span>
                      {t.label} ·{' '}
                      <span style={{ opacity: 0.6 }}>
                        {t.lastUsedAt ? `last used ${new Date(t.lastUsedAt).toLocaleDateString()}` : 'never used'}
                      </span>
                    </span>
                    <button className="link-btn" onClick={() => void revoke(t.id)}>
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function Snippet({ text }: { text: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <pre
        style={{
          margin: '4px 0 0',
          padding: '10px 12px',
          background: 'var(--input-bg, #14141b)',
          border: '1px solid var(--border, #2a2a35)',
          borderRadius: 8,
          fontSize: 12.5,
          overflowX: 'auto',
          whiteSpace: 'pre',
        }}
      >
        {text}
      </pre>
      <button
        className="link-btn"
        style={{ position: 'absolute', top: 6, right: 8 }}
        onClick={() => void navigator.clipboard?.writeText(text)}
      >
        Copy
      </button>
    </div>
  );
}
