'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Component, ComponentAsset } from '@/domains/shared/component';

export function AssetsModal({
  component,
  refs,
  onClose,
  onUploaded,
}: {
  component: Component;
  refs: string[];
  onClose: () => void;
  onUploaded: (asset: ComponentAsset) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const resolved = new Map((component.assets ?? []).map((a) => [a.refPath, a]));

  // Portal to <body> so the modal escapes the card's hover transform (which
  // would otherwise anchor position:fixed to the card and make it flicker).
  if (!mounted) return null;

  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Assets · {component.name}</h3>
          <button className="icon-btn x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-hint" style={{ marginTop: 0 }}>
            This component references files that aren’t in the code. Upload each one, or paste a
            direct URL to it, and the preview will load it (up to 25&nbsp;MB each).
          </p>
          <div className="asset-list">
            {refs.map((ref) => (
              <AssetRow
                key={ref}
                componentId={component.componentId}
                refPath={ref}
                current={resolved.get(ref) ?? null}
                onUploaded={onUploaded}
              />
            ))}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function AssetRow({
  componentId,
  refPath,
  current,
  onUploaded,
}: {
  componentId: string;
  refPath: string;
  current: ComponentAsset | null;
  onUploaded: (asset: ComponentAsset) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<ComponentAsset | null>(current);
  const [url, setUrl] = useState('');

  async function send(body: FormData) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/components/${componentId}/assets`, { method: 'POST', body });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(json.asset);
        setUrl('');
        onUploaded(json.asset);
      } else {
        setError(json.detail || json.error || `Failed (${res.status})`);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function uploadFile(file: File) {
    const body = new FormData();
    body.append('refPath', refPath);
    body.append('file', file);
    void send(body);
  }

  function useUrl() {
    const trimmed = url.trim();
    if (!trimmed) return;
    const body = new FormData();
    body.append('refPath', refPath);
    body.append('url', trimmed);
    void send(body);
  }

  return (
    <div className={`asset-row${done ? ' resolved' : ''}`}>
      <div className="asset-info">
        <span className="asset-status">{done ? '✓' : '○'}</span>
        <code className="asset-path">{refPath}</code>
        {done && <span className="asset-file">{done.filename}</span>}
      </div>
      <div className="asset-action">
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadFile(f);
          }}
        />
        <input
          className="asset-url"
          type="url"
          placeholder="or paste a direct file URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') useUrl();
          }}
          disabled={busy}
        />
        {url.trim() ? (
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={useUrl}>
            {busy ? '…' : 'Use URL'}
          </button>
        ) : (
          <button
            className="btn btn-ghost btn-sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? '…' : done ? 'Replace' : 'Upload'}
          </button>
        )}
      </div>
      {error && <div className="asset-error">⚠ {error}</div>}
    </div>
  );
}
