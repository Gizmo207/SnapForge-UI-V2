'use client';

import { useRef, useState } from 'react';
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
  const resolved = new Map((component.assets ?? []).map((a) => [a.refPath, a]));

  return (
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
            This component references files that aren’t in the code. Upload each one and the
            preview will load it (3D models, images, fonts — up to 25&nbsp;MB each).
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
    </div>
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

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('refPath', refPath);
      body.append('file', file);
      const res = await fetch(`/api/components/${componentId}/assets`, { method: 'POST', body });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone(json.asset);
        onUploaded(json.asset);
      } else {
        setError(json.detail || json.error || `Upload failed (${res.status})`);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`asset-row${done ? ' resolved' : ''}`}>
      <div className="asset-info">
        <span className="asset-status">{done ? '✓' : '○'}</span>
        <code className="asset-path">{refPath}</code>
      </div>
      <div className="asset-action">
        {done && <span className="asset-file">{done.filename}</span>}
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
        <button
          className="btn btn-ghost btn-sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Uploading…' : done ? 'Replace' : 'Upload'}
        </button>
      </div>
      {error && <div className="asset-error">⚠ {error}</div>}
    </div>
  );
}
