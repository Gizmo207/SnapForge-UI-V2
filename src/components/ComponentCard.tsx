'use client';

import { useState } from 'react';
import type { Component } from '@/domains/shared/component';
import { PreviewSandbox } from './PreviewSandbox';
import { pickShowcase } from './showcase';

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
  const sc = pickShowcase(component);

  return (
    <article className={`card${selected ? ' selected' : ''}`}>
      <div
        className="card-stage"
        style={{ background: sc.bg }}
        onMouseEnter={() => allowed && setLive(true)}
      >
        {!allowed ? (
          <div className="stage-blocked">🔒 blocked by gate</div>
        ) : live ? (
          <PreviewSandbox component={component} />
        ) : (
          <button
            className="stage-poster"
            style={{ color: sc.theme === 'dark' ? '#9aa0b5' : '#7a8194' }}
            onClick={() => setLive(true)}
            aria-label="Preview"
          >
            <span className="play">▶</span>
          </button>
        )}

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

      <div className="card-foot">
        <span className="name" title={component.name}>
          {component.name}
        </span>
        <span className="fw-tag">{component.framework}</span>
      </div>
    </article>
  );
}
