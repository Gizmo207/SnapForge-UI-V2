'use client';

import { useState } from 'react';
import type { Component } from '@/domains/shared/component';
import { PreviewSandbox } from './PreviewSandbox';

export function ComponentCard({
  component,
  selected,
  onToggle,
}: {
  component: Component;
  selected: boolean;
  onToggle: () => void;
}) {
  const [live, setLive] = useState(false);
  const allowed = component.sanitizationOutcome === 'allowed' && !!component.sanitizedArtifact;

  return (
    <article className={`card${selected ? ' selected' : ''}${allowed ? '' : ' blocked'}`}>
      <div
        className="card-stage"
        onMouseEnter={() => allowed && setLive(true)}
      >
        {!allowed ? (
          <div className="stage-blocked">
            <span>🔒 Blocked by the sanitization gate</span>
            <span style={{ color: 'var(--text-faint)' }}>{component.sanitizationOutcome}</span>
          </div>
        ) : live ? (
          <PreviewSandbox component={component} />
        ) : (
          <button className="stage-poster" onClick={() => setLive(true)} aria-label="Preview">
            <span className="play">▶</span>
            <span>hover to preview</span>
          </button>
        )}
      </div>

      <div className="card-body">
        <div className="card-title">
          <h3 title={component.name}>{component.name}</h3>
          <div
            className={`select-box${selected ? ' on' : ''}`}
            onClick={onToggle}
            role="checkbox"
            aria-checked={selected}
            aria-label={`select ${component.name}`}
          >
            ✓
          </div>
        </div>
        <div className="chips">
          <span className="chip fw">{component.framework}</span>
          <span className="chip">
            {component.category}/{component.subcategory}
          </span>
          {component.tags.slice(0, 3).map((t) => (
            <span key={t} className="chip tag">
              #{t}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
