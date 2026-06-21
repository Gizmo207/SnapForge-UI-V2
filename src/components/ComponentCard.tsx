'use client';

import { useState } from 'react';
import type { Component } from '@/domains/shared/component';
import { PreviewSandbox } from './PreviewSandbox';
import { pickShowcase, showcaseHeight } from './showcase';

export function ComponentCard({
  component,
  selected,
  onToggle,
  onSetTheme,
}: {
  component: Component;
  selected: boolean;
  onToggle: () => void;
  onSetTheme: (theme: 'light' | 'dark') => void;
}) {
  const [live, setLive] = useState(false);
  const allowed = component.sanitizationOutcome === 'allowed' && !!component.sanitizedArtifact;
  const sc = pickShowcase(component);

  return (
    <article className={`card${selected ? ' selected' : ''}`}>
      <div
        className="showcase"
        style={{ background: sc.bg, height: showcaseHeight(component) }}
        onMouseEnter={() => allowed && setLive(true)}
      >
        {!allowed ? (
          <div className="stage-blocked">🔒 blocked by gate</div>
        ) : live ? (
          <PreviewSandbox component={component} />
        ) : (
          <button className="stage-poster" onClick={() => setLive(true)} aria-label="Preview">
            <span className="play">▶</span>
          </button>
        )}

        <button
          className="theme-toggle"
          onClick={() => onSetTheme(sc.theme === 'dark' ? 'light' : 'dark')}
          aria-label={`show on ${sc.theme === 'dark' ? 'light' : 'dark'} background`}
          title="Toggle showcase background"
        >
          {sc.theme === 'dark' ? '☀' : '☾'}
        </button>

        <button
          className={`select-overlay${selected ? ' on' : ''}`}
          onClick={onToggle}
          role="checkbox"
          aria-checked={selected}
          aria-label={`select ${component.name}`}
        >
          ✓
        </button>
      </div>

      <div className="card-meta">
        <span className="name" title={component.name}>
          {component.name}
        </span>
        <span className="meta">
          {component.framework} · {component.subcategory}
        </span>
      </div>
    </article>
  );
}
