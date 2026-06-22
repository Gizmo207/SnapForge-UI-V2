'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Component, ComponentAsset } from '@/domains/shared/component';
import { detectAssets } from '@/domains/ingestion/pure/detectAssets';
import { PreviewSandbox } from './PreviewSandbox';
import { AssetsModal } from './AssetsModal';
import {
  pickShowcase,
  showcaseHeight,
  worksOnBoth,
  isImmersive,
  needsInteractionHint,
} from './showcase';

export function ComponentCard({
  component,
  selected,
  onToggle,
  onSetTheme,
  onAssetUploaded,
  onDelete,
}: {
  component: Component;
  selected: boolean;
  onToggle: () => void;
  onSetTheme: (theme: 'light' | 'dark') => void;
  onAssetUploaded: (asset: ComponentAsset) => void;
  onDelete: () => void;
}) {
  const [live, setLive] = useState(false);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const allowed = component.sanitizationOutcome === 'allowed' && !!component.sanitizedArtifact;

  const assetRefs = useMemo(() => detectAssets(component.source), [component.source]);
  const resolvedCount = (component.assets ?? []).filter((a) =>
    assetRefs.includes(a.refPath),
  ).length;
  const missingCount = assetRefs.length - resolvedCount;
  const immersive = isImmersive(component);
  const sc = pickShowcase(component);
  // Only offer the light/dark toggle when both look good; otherwise the stage is
  // locked to the component's best theme so it always reads well.
  const canToggle = worksOnBoth(component.source);

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
    <article className={`card${selected ? ' selected' : ''}${immersive ? ' wide' : ''}`}>
      <div
        ref={stageRef}
        className="showcase"
        style={{ background: sc.bg, height: showcaseHeight(component) }}
      >
        {!allowed ? (
          <div className="stage-blocked">🔒 blocked by gate</div>
        ) : missingCount > 0 ? (
          <div className="stage-assets">
            <div className="stage-assets-mark">🧩</div>
            <div className="stage-assets-title">
              Missing {missingCount} asset{missingCount > 1 ? 's' : ''}
            </div>
            <p>This component needs files that aren’t in the code to preview.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setAssetsOpen(true)}>
              Upload files or paste URLs
            </button>
          </div>
        ) : live ? (
          <>
            <PreviewSandbox component={component} />
            {needsInteractionHint(component) && (
              <div className="stage-hint" aria-hidden>
                <span>✦ Hover to interact</span>
              </div>
            )}
          </>
        ) : (
          <div className="stage-poster" aria-hidden>
            <span className="stage-spinner" />
          </div>
        )}

        {canToggle && (
          <button
            className="theme-toggle"
            onClick={() => onSetTheme(sc.theme === 'dark' ? 'light' : 'dark')}
            aria-label={`show on ${sc.theme === 'dark' ? 'light' : 'dark'} background`}
            title="Toggle showcase background"
          >
            {sc.theme === 'dark' ? '☀' : '☾'}
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

        <button
          className="card-delete"
          onClick={onDelete}
          aria-label={`delete ${component.name}`}
          title="Delete from vault"
        >
          🗑
        </button>
      </div>

      <div className="card-meta">
        <span className="name" title={component.name}>
          {component.name}
        </span>
        {assetRefs.length > 0 ? (
          <button
            className={`asset-chip${missingCount > 0 ? ' missing' : ' ok'}`}
            onClick={() => setAssetsOpen(true)}
            title={missingCount > 0 ? `${missingCount} missing asset(s)` : 'Assets provided'}
          >
            {missingCount > 0 ? `⬆ ${missingCount} asset${missingCount > 1 ? 's' : ''}` : '✓ assets'}
          </button>
        ) : (
          <span className="meta">
            {component.framework} · {component.subcategory}
          </span>
        )}
      </div>

      {assetsOpen && (
        <AssetsModal
          component={component}
          refs={assetRefs}
          onClose={() => setAssetsOpen(false)}
          onUploaded={onAssetUploaded}
        />
      )}
    </article>
  );
}
