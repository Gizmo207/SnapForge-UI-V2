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
  onSubmit: (source: string, css?: string) => void;
}) {
  const [value, setValue] = useState('');
  const [css, setCss] = useState('');
  const [showCss, setShowCss] = useState(false);

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

          {showCss ? (
            <div className="css-field">
              <label className="css-label">
                CSS <span>(paste the component’s separate .css file here)</span>
              </label>
              <textarea
                className="css-textarea"
                spellCheck={false}
                placeholder={'.glass-surface {\n  position: relative;\n  ...\n}'}
                value={css}
                onChange={(e) => setCss(e.target.value)}
              />
            </div>
          ) : (
            <button className="link-btn" onClick={() => setShowCss(true)}>
              ＋ This component has a separate CSS file
            </button>
          )}

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
            onClick={() => onSubmit(value, css.trim() ? css : undefined)}
          >
            {busy ? 'Adding…' : 'Add to vault'}
          </button>
        </div>
      </div>
    </div>
  );
}
