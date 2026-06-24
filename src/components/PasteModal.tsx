'use client';

import { useEffect, useRef, useState } from 'react';
import { looksLikeOnlyCss } from '@/domains/ingestion/pure/looksLikeCss';
import { filesFromZip, filesFromFileList } from './upload';

export function PasteModal({
  busy,
  error,
  onClose,
  onSubmit,
  onSubmitFiles,
}: {
  busy: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (source: string, css?: string, demo?: string) => void;
  onSubmitFiles: (files: Record<string, string>) => void;
}) {
  const [value, setValue] = useState('');
  const [css, setCss] = useState('');
  const [showCss, setShowCss] = useState(false);
  const [demo, setDemo] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // <input webkitdirectory> isn't typed in React; set it imperatively.
  const folderRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    folderRef.current?.setAttribute('webkitdirectory', '');
  }, []);

  async function handleUpload(read: Promise<Record<string, string>>) {
    setUploadBusy(true);
    setUploadError(null);
    try {
      const files = await read;
      if (Object.keys(files).length === 0) {
        setUploadError('No source files found in that upload (need .tsx/.jsx/.ts/.css).');
        return;
      }
      onSubmitFiles(files);
    } catch (e) {
      setUploadError((e as Error).message || 'Could not read the upload.');
    } finally {
      setUploadBusy(false);
    }
  }

  // The main box wants the JSX/HTML. If it's a bare stylesheet, the component
  // code is missing — warn before submit and steer the CSS to its own field.
  const cssInCodeBox = looksLikeOnlyCss(value);

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
          <div className="upload-row">
            <span className="upload-label">
              Got all the files? Upload a <strong>folder</strong> or <strong>.zip</strong> — multi-file
              components (shadcn, etc.) just work:
            </span>
            <div className="upload-btns">
              <label className={`btn btn-ghost btn-sm${uploadBusy || busy ? ' is-disabled' : ''}`}>
                📁 Folder
                <input
                  ref={folderRef}
                  type="file"
                  hidden
                  multiple
                  disabled={uploadBusy || busy}
                  onChange={(e) => {
                    const l = e.target.files;
                    if (l && l.length) void handleUpload(filesFromFileList(l));
                    e.target.value = '';
                  }}
                />
              </label>
              <label className={`btn btn-ghost btn-sm${uploadBusy || busy ? ' is-disabled' : ''}`}>
                🗜 .zip
                <input
                  type="file"
                  hidden
                  accept=".zip,application/zip,application/x-zip-compressed"
                  disabled={uploadBusy || busy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleUpload(filesFromZip(f));
                    e.target.value = '';
                  }}
                />
              </label>
              {uploadBusy && <span className="upload-status">Reading files…</span>}
            </div>
            {uploadError && <div className="paste-warn">⚠ {uploadError}</div>}
          </div>
          <div className="upload-divider">
            <span>or paste a single component</span>
          </div>

          <textarea
            autoFocus
            spellCheck={false}
            placeholder={'Paste a React or HTML snippet…\n\nexport default function PrimaryButton() {\n  return <button className="btn">Click me</button>;\n}'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <p className="modal-hint">
            It’s parsed, classified, and security-checked before anything runs. Code only
            previews inside a sandbox once it passes the gate. <br />
            <span style={{ opacity: 0.85 }}>
              Paste the component’s <strong>actual code</strong> — if a site shows an install
              command (<code>npx shadcn add…</code>), grab the source from its <strong>Manual</strong>{' '}
              tab instead. The <code>cn</code> helper and <code>@/</code> imports are handled for you.
            </span>
          </p>

          {cssInCodeBox && (
            <div className="paste-warn">
              <span>
                ⚠ This looks like a <strong>CSS file</strong>, not a component. The main box
                needs the JSX/HTML — paste the CSS in its own field instead.
              </span>
              <button
                className="link-btn"
                onClick={() => {
                  setCss(value);
                  setShowCss(true);
                  setValue('');
                }}
              >
                Move this to the CSS field →
              </button>
            </div>
          )}

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

          {showDemo ? (
            <div className="css-field">
              <label className="css-label">
                Demo / usage <span className="opt-tag">optional</span>
                <span>
                  {' '}
                  — only needed if the component renders empty on its own (a wrapper). If a site
                  lists several usage snippets, the simplest <code>&lt;Component /&gt;</code> is
                  usually all you need; the rest just show optional props.
                </span>
              </label>
              <textarea
                className="css-textarea"
                spellCheck={false}
                placeholder={'<GlassSurface width={300} height={200} borderRadius={40}>\n  <h2>Glass Surface</h2>\n</GlassSurface>'}
                value={demo}
                onChange={(e) => setDemo(e.target.value)}
              />
            </div>
          ) : (
            <button className="link-btn" onClick={() => setShowDemo(true)}>
              ＋ Add a usage/demo example <span className="opt-tag">optional</span>
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
            disabled={!value.trim() || busy || cssInCodeBox}
            onClick={() =>
              onSubmit(value, css.trim() ? css : undefined, demo.trim() ? demo : undefined)
            }
          >
            {busy ? 'Adding…' : 'Add to vault'}
          </button>
        </div>
      </div>
    </div>
  );
}
