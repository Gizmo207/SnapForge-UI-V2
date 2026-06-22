'use client';

import { useEffect, useState } from 'react';
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

  // State lifted here so "Save & close" can flush every typed URL at once —
  // users paste several and expect one button to commit them all.
  const [saved, setSaved] = useState<Record<string, ComponentAsset>>(
    Object.fromEntries((component.assets ?? []).map((a) => [a.refPath, a])),
  );
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function saveOne(refPath: string, body: FormData): Promise<void> {
    const res = await fetch(`/api/components/${component.componentId}/assets`, {
      method: 'POST',
      body,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErrors((e) => ({ ...e, [refPath]: json.detail || json.error || `Failed (${res.status})` }));
      throw new Error('save failed');
    }
    setErrors((e) => ({ ...e, [refPath]: '' }));
    setSaved((s) => ({ ...s, [refPath]: json.asset }));
    setUrls((u) => ({ ...u, [refPath]: '' }));
    onUploaded(json.asset);
  }

  async function uploadFile(refPath: string, file: File) {
    const body = new FormData();
    body.append('refPath', refPath);
    body.append('file', file);
    setBusy(true);
    try {
      await saveOne(refPath, body);
    } catch {
      /* error surfaced per-row */
    } finally {
      setBusy(false);
    }
  }

  async function saveAndClose() {
    const pending = refs.filter(
      (r) => urls[r]?.trim() && saved[r]?.url !== urls[r].trim(),
    );
    if (pending.length === 0) {
      onClose();
      return;
    }
    setBusy(true);
    const results = await Promise.allSettled(
      pending.map((r) => {
        const url = urls[r].trim();
        if (!/^https?:\/\//i.test(url)) {
          setErrors((e) => ({ ...e, [r]: 'Enter a full https:// URL' }));
          return Promise.reject(new Error('bad url'));
        }
        const body = new FormData();
        body.append('refPath', r);
        body.append('url', url);
        return saveOne(r, body);
      }),
    );
    setBusy(false);
    if (results.every((x) => x.status === 'fulfilled')) onClose();
  }

  if (!mounted) return null;

  const pendingCount = refs.filter((r) => urls[r]?.trim() && saved[r]?.url !== urls[r].trim()).length;
  const savedCount = refs.filter((r) => saved[r]).length;

  return createPortal(
    <div className="overlay" onClick={busy ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>
            Assets · {component.name}{' '}
            <span className="asset-count">
              {savedCount}/{refs.length} provided
            </span>
          </h3>
          <button className="icon-btn x" onClick={onClose} aria-label="Close" disabled={busy}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-hint" style={{ marginTop: 0 }}>
            This component references files that aren’t in the code. For each one, either
            <strong> Upload</strong> a file or paste a direct URL — then hit{' '}
            <strong>Save &amp; close</strong>. (Up to 25&nbsp;MB each.)
          </p>
          <div className="asset-list">
            {refs.map((ref) => (
              <AssetRow
                key={ref}
                refPath={ref}
                saved={saved[ref] ?? null}
                url={urls[ref] ?? ''}
                error={errors[ref] || null}
                disabled={busy}
                onUrlChange={(v) => setUrls((u) => ({ ...u, [ref]: v }))}
                onUpload={(f) => uploadFile(ref, f)}
              />
            ))}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-primary" onClick={saveAndClose} disabled={busy}>
            {busy ? 'Saving…' : pendingCount > 0 ? `Save & close (${pendingCount})` : 'Done'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function AssetRow({
  refPath,
  saved,
  url,
  error,
  disabled,
  onUrlChange,
  onUpload,
}: {
  refPath: string;
  saved: ComponentAsset | null;
  url: string;
  error: string | null;
  disabled: boolean;
  onUrlChange: (value: string) => void;
  onUpload: (file: File) => void;
}) {
  return (
    <div className={`asset-row${saved ? ' resolved' : ''}`}>
      <div className="asset-info">
        <span className="asset-status">{saved ? '✓' : '○'}</span>
        <code className="asset-path">{refPath}</code>
        {saved && <span className="asset-file">{saved.filename}</span>}
      </div>
      <div className="asset-action">
        <input
          className="asset-url"
          type="url"
          placeholder={saved ? 'replace with a URL' : 'paste a direct file URL'}
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          disabled={disabled}
        />
        <label className={`btn btn-ghost btn-sm${disabled ? ' is-disabled' : ''}`}>
          {saved ? 'Replace' : 'Upload'}
          <input
            type="file"
            hidden
            disabled={disabled}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.target.value = '';
            }}
          />
        </label>
      </div>
      {error && <div className="asset-error">⚠ {error}</div>}
    </div>
  );
}
