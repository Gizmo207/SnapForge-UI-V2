'use client';

import { useEffect, useRef, useState } from 'react';
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
  const stageRef = useRef<HTMLDivElement>(null);
  const allowed = component.sanitizationOutcome === 'allowed' && !!component.sanitizedArtifact;
  const sc = pickShowcase(component);

  // Auto-load the preview when the card scrolls into view (no hover needed).
  // Offscreen cards stay deferred so we don't mount dozens of sandboxes at once.
  useEffect(() => {
    if (!allowed || live) return;
    const el = stageRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setLive(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLive(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [allowed, live]);

  return (
    <article className={`card${selected ? ' selected' : ''}`}>
      <div
        ref={stageRef}
        className="showcase"
        style={{ background: sc.bg, height: showcaseHeight(component) }}
      >
        {!allowed ? (
          <div className="stage-blocked">🔒 blocked by gate</div>
        ) : live ? (
          <PreviewSandbox component={component} />
        ) : (
          <div className="stage-poster" aria-hidden>
            <span className="stage-spinner" />
          </div>
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
