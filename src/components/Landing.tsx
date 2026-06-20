'use client';

import { useEffect, useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';

type ProviderInfo = { id: string; name: string };

const STEPS = [
  { n: '01', title: 'Paste', body: 'Drop in any React or HTML snippet. No forms, no tagging.' },
  { n: '02', title: 'Auto-classified', body: 'Framework, name, dependencies, and category are detected for you.' },
  { n: '03', title: 'Safe preview', body: 'Untrusted code runs only in a sandbox — never on the page.' },
  { n: '04', title: 'Export', body: 'Multi-select and download a clean, drop-in zip bundle.' },
];

export function Landing() {
  const [providers, setProviders] = useState<ProviderInfo[] | null>(null);

  useEffect(() => {
    getProviders().then((p) => {
      setProviders(p ? (Object.values(p) as ProviderInfo[]) : []);
    });
  }, []);

  return (
    <main className="landing">
      <span className="landing-badge">◆ Your personal UI component vault</span>
      <h1>
        Your snippets,
        <br />
        <span className="grad">organized &amp; alive.</span>
      </h1>
      <p className="landing-sub">
        Paste any React or HTML component. SnapForge parses it, classifies it, runs it
        safely in a sandbox, and keeps it searchable — ready to export whenever you need it.
      </p>

      <div className="landing-cta">
        {providers === null ? (
          <button className="btn btn-primary btn-lg" disabled>
            Loading…
          </button>
        ) : providers.length > 0 ? (
          providers.map((p) => (
            <button key={p.id} className="btn btn-primary btn-lg" onClick={() => signIn(p.id)}>
              Continue with {p.name}
            </button>
          ))
        ) : (
          <a className="btn btn-primary btn-lg" href="/api/auth/signin">
            Sign in
          </a>
        )}
      </div>

      <div className="landing-steps">
        {STEPS.map((s) => (
          <div className="step" key={s.n}>
            <div className="step-n">{s.n}</div>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
        ))}
      </div>

      <p className="landing-foot">Private to you. Every account gets its own isolated vault.</p>
    </main>
  );
}
