'use client';

import { useEffect, useState } from 'react';

type TokenInfo = { id: string; label: string; createdAt: string; lastUsedAt: string | null };

type ClientGuide = {
  id: string;
  label: string;
  where: string;
  lang: 'bash' | 'json';
  snippet: (url: string, token: string) => string;
};

/**
 * Per-client connection instructions. Each AI tool reads MCP config from a
 * different place and uses a slightly different shape (url vs serverUrl, the
 * `servers` vs `mcpServers` key), so we give the exact, paste-ready form.
 */
const CLIENTS: ClientGuide[] = [
  {
    id: 'claude',
    label: 'Claude Code',
    where: 'Run this in your terminal.',
    lang: 'bash',
    snippet: (url, token) =>
      `claude mcp add --transport http snapforge ${url} \\\n  --header "Authorization: Bearer ${token}"`,
  },
  {
    id: 'cursor',
    label: 'Cursor',
    where: 'Add to ~/.cursor/mcp.json (global) or .cursor/mcp.json (project).',
    lang: 'json',
    snippet: (url, token) =>
      `{
  "mcpServers": {
    "snapforge": {
      "url": "${url}",
      "headers": { "Authorization": "Bearer ${token}" }
    }
  }
}`,
  },
  {
    id: 'windsurf',
    label: 'Windsurf',
    where: 'Add to ~/.codeium/windsurf/mcp_config.json.',
    lang: 'json',
    snippet: (url, token) =>
      `{
  "mcpServers": {
    "snapforge": {
      "serverUrl": "${url}",
      "headers": { "Authorization": "Bearer ${token}" }
    }
  }
}`,
  },
  {
    id: 'vscode',
    label: 'VS Code',
    where: 'Add to .vscode/mcp.json in your workspace.',
    lang: 'json',
    snippet: (url, token) =>
      `{
  "servers": {
    "snapforge": {
      "type": "http",
      "url": "${url}",
      "headers": { "Authorization": "Bearer ${token}" }
    }
  }
}`,
  },
];

/**
 * Connect-your-vault-to-an-AI-agent panel. Generates a named MCP personal access
 * token (shown once), lists/revokes existing tokens, and shows correct copy-paste
 * setup for each supported client. The raw token never persists in the client
 * beyond its one-time reveal.
 */
export function McpModal({ onClose }: { onClose: () => void }) {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [label, setLabel] = useState('');
  const [fresh, setFresh] = useState<string | null>(null);
  const [client, setClient] = useState<ClientGuide>(CLIENTS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

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

  function copy(key: string, text: string) {
    void navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
  }

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/mcp/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() || undefined }),
      });
      const body = await res.json();
      if (res.ok) {
        setFresh(body.token);
        setLabel('');
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
    if (tokens.length <= 1) setFresh(null);
    void load();
  }

  const tokenForSnippet = fresh ?? 'YOUR_TOKEN';
  const snippet = client.snippet(mcpUrl, tokenForSnippet);

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
            Give Claude Code, Cursor, Windsurf, or VS Code read-only access to your component
            vault over MCP. Your agent can then <strong>search</strong>, <strong>list</strong>, and{' '}
            <strong>pull</strong> your saved components to build with — e.g.{' '}
            <em>“build a landing page using components from my SnapForge vault.”</em>
          </p>

          {/* Generate a (named) token */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              spellCheck={false}
              placeholder="Token name (e.g. “Cursor — laptop”)"
              value={label}
              disabled={busy}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !busy && void generate()}
              style={{
                flex: 1,
                minWidth: 0,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border, #2a2a35)',
                background: 'var(--input-bg, #14141b)',
                color: 'inherit',
                fontSize: 13,
              }}
            />
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={generate}>
              {busy ? 'Generating…' : '＋ Generate token'}
            </button>
          </div>
          {error && <div className="paste-warn">⚠ {error}</div>}

          {fresh && (
            <div className="css-field" style={{ marginTop: 12 }}>
              <label className="css-label">
                Your new token <span>(copy it now — it won’t be shown again)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <code
                  style={{
                    display: 'block',
                    padding: '10px 40px 10px 12px',
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
                  style={{ position: 'absolute', top: 8, right: 8 }}
                  onClick={() => copy('token', fresh)}
                >
                  {copied === 'token' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Per-client setup */}
          <div className="upload-divider">
            <span>set up your client</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {CLIENTS.map((c) => (
              <button
                key={c.id}
                className={`btn btn-sm${c.id === client.id ? ' btn-primary' : ' btn-ghost'}`}
                onClick={() => setClient(c)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="modal-hint" style={{ margin: '0 0 4px' }}>
            {client.where}
            {!fresh && (
              <>
                {' '}
                <span style={{ opacity: 0.7 }}>
                  Generate a token above, then it’s filled in here automatically.
                </span>
              </>
            )}
          </p>
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
              {snippet}
            </pre>
            <button
              className="link-btn"
              style={{ position: 'absolute', top: 6, right: 8 }}
              onClick={() => copy('snippet', snippet)}
            >
              {copied === 'snippet' ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Existing tokens */}
          {tokens.length > 0 && (
            <>
              <div className="upload-divider">
                <span>your tokens</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {tokens.map((t) => (
                  <li
                    key={t.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '7px 0',
                      fontSize: 13,
                      borderBottom: '1px solid var(--border, #23232c)',
                    }}
                  >
                    <span>
                      <strong>{t.label}</strong>
                      <span style={{ opacity: 0.6 }}>
                        {' · '}
                        created {new Date(t.createdAt).toLocaleDateString()}
                        {' · '}
                        {t.lastUsedAt
                          ? `last used ${new Date(t.lastUsedAt).toLocaleDateString()}`
                          : 'never used'}
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
