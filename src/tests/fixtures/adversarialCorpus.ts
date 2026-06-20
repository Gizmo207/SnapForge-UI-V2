import type { Framework } from '../../domains/ingestion/pure/detectFramework';
import type { SanitizationOutcome } from '../../domains/sanitization/pure/types';

/**
 * Adversarial + safe corpus for the sanitization gate. Each hostile input is one
 * that defeats v1's old substring-blocklist approach; we assert the gate's
 * outcome on a parsed/cleaned representation, not on string matching.
 */
export type SanitizationFixture = {
  id: string;
  framework: Framework;
  source: string;
  expected: SanitizationOutcome;
};

export const sanitizationCorpus: SanitizationFixture[] = [
  // --- HTML: hostile -> blocked ---
  { id: 'html-script-tag', framework: 'html', source: `<div>hi</div><script>alert(1)</script>`, expected: 'blocked' },
  { id: 'html-onclick', framework: 'html', source: `<button onclick="steal()">x</button>`, expected: 'blocked' },
  { id: 'html-onerror-img', framework: 'html', source: `<img src="x" onerror="alert(1)" />`, expected: 'blocked' },
  { id: 'html-js-href', framework: 'html', source: `<a href="javascript:alert(1)">link</a>`, expected: 'blocked' },
  { id: 'html-iframe', framework: 'html', source: `<iframe src="https://evil.example"></iframe>`, expected: 'blocked' },

  // --- HTML: safe -> allowed ---
  { id: 'html-clean-card', framework: 'html', source: `<div class="card"><h3>Title</h3><p>Body</p></div>`, expected: 'allowed' },
  // The literal word "window" as text must NOT be blocked (a substring blocklist would falsely block it).
  { id: 'html-benign-window-text', framework: 'html', source: `<p>Open the window for fresh air. document your day.</p>`, expected: 'allowed' },
  { id: 'html-empty', framework: 'html', source: `   `, expected: 'blocked' },

  // --- React/JSX: hostile -> blocked ---
  { id: 'jsx-window-access', framework: 'react', source: `export default function C(){ const w = window.location.href; return <div>{w}</div>; }`, expected: 'blocked' },
  { id: 'jsx-document-cookie', framework: 'react', source: `export default function C(){ return <div>{document.cookie}</div>; }`, expected: 'blocked' },
  { id: 'jsx-eval', framework: 'react', source: `export default function C(){ eval('alert(1)'); return <div/>; }`, expected: 'blocked' },
  { id: 'jsx-dangerously-set', framework: 'react', source: `export default function C(){ return <div dangerouslySetInnerHTML={{ __html: '<b>x</b>' }} />; }`, expected: 'blocked' },
  { id: 'jsx-script-element', framework: 'react', source: `export default function C(){ return <div><script>{'a'}</script></div>; }`, expected: 'blocked' },

  // --- React/JSX: safe -> allowed ---
  { id: 'jsx-clean-button', framework: 'react', source: `import React from 'react';\nexport default function B(){ return <button className="btn">Go</button>; }`, expected: 'allowed' },
  // `windowSize` is a different identifier than `window`; an AST check allows it where a substring scan would not.
  { id: 'jsx-benign-window-like-name', framework: 'react', source: `import React from 'react';\nexport default function B(){ const windowSize = 10; return <div>{windowSize}</div>; }`, expected: 'allowed' },

  // --- React/JSX: malformed -> invalid ---
  { id: 'jsx-broken', framework: 'react', source: `export default function C( { return <div</ ; }`, expected: 'invalid' },
];
