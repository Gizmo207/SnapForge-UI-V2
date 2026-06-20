'use client';

import { useState } from 'react';

export function PasteModal({
  busy,
  error,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (source: string) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Add a component</h3>
          <button className="icon-btn x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal-body">
          <textarea
            autoFocus
            spellCheck={false}
            placeholder={'Paste a React or HTML snippet…\n\nexport default function PrimaryButton() {\n  return <button className="btn">Click me</button>;\n}'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <p className="modal-hint">
            It’s parsed, classified, and security-checked before anything runs. Code only
            previews inside a sandbox once it passes the gate.
          </p>
          {error && (
            <p
              style={{
                margin: '12px 2px 0',
                color: 'var(--bad)',
                fontSize: 13,
                background: 'rgba(251,113,133,.08)',
                border: '1px solid rgba(251,113,133,.3)',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              ⚠ {error}
            </p>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!value.trim() || busy}
            onClick={() => onSubmit(value)}
          >
            {busy ? 'Adding…' : 'Add to vault'}
          </button>
        </div>
      </div>
    </div>
  );
}
