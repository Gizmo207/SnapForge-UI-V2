'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BackdropId, Component, ComponentAsset } from '@/domains/shared/component';
import { detectAssets } from '@/domains/ingestion/pure/detectAssets';
import { PreviewSandbox } from './PreviewSandbox';
import { scheduleMount } from './previewGate';
import { AssetsModal } from './AssetsModal';
import {
  pickShowcase,
  showcaseHeight,
  worksOnBoth,
  needsInteractionHint,
  backdropCss,
  nextBackdrop,
} from './showcase';
import { CAT_ORDER, catLabel } from './categories';

export function ComponentCard({
  component,
  selected,
  onToggle,
  onSetTheme,
  onSetBackdrop,
  onSetSubcategory,
  onAssetUploaded,
  onDelete,
}: {
  component: Component;
  selected: boolean;
  onToggle: () => void;
  onSetTheme: (theme: 'light' | 'dark') => void;
  onSetBackdrop: (backdrop: BackdropId | null) => void;
  onSetSubcategory: (subcategory: string) => void;
  onAssetUploaded: (asset: ComponentAsset) => void;
  onDelete: () => void;
}) {
  const [live, setLive] = useState(false);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // Close the expanded preview on Escape, the expected fullscreen gesture.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setExpanded(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);
  const allowed = component.sanitizationOutcome === 'allowed' && !!component.sanitizedArtifact;

  // Assets can be referenced from the component, its stylesheet, OR its demo
  // (e.g. <ProfileCard avatarUrl="/path/to/avatar.jpg" />), so scan all three —
  // otherwise prop-supplied images are never detected and never prompted for.
  const assetRefs = useMemo(
    () =>
      detectAssets(
        [component.source, component.cssSource, component.demoSource].filter(Boolean).join('\n'),
      ),
    [component.source, component.cssSource, component.demoSource],
  );
  const resolvedCount = (component.assets ?? []).filter((a) =>
    assetRefs.includes(a.refPath),
  ).length;
  const missingCount = assetRefs.length - resolvedCount;
  const showHint = needsInteractionHint(component);
  const sc = pickShowcase(component);
  // Only offer the light/dark toggle when both look good; otherwise the stage is
  // locked to the component's best theme so it always reads well.
  const canToggle = worksOnBoth(component.source);

  // Auto-load the preview when the card scrolls into view (no hover needed).
  // Offscreen cards stay deferred so we don't mount dozens of sandboxes at once;
  // and when many become visible together, scheduleMount staggers their start so
  // the Sandpack bundler isn't hit by a simultaneous burst (which times out).
  useEffect(() => {
    if (!allowed || live) return;
    const el = stageRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setLive(true);
      return;
    }
    let cancelMount: (() => void) | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          cancelMount = scheduleMount(() => setLive(true));
        }
      },
      { rootMargin: '150px' },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelMount?.();
    };
  }, [allowed, live]);

  return (
    <article className={`card${selected ? ' selected' : ''}`}>
      <div
        ref={stageRef}
        className="showcase"
        style={{ background: backdropCss(component.backdrop) ?? sc.bg, height: showcaseHeight(component) }}
      >
        {!allowed ? (
          <div className="stage-blocked">🔒 blocked by gate</div>
        ) : live && !expanded ? (
          // Missing assets never block the preview — a component usually renders
          // fine without an optional image/texture (and the host library ships
          // those demo files separately, so they can't be in the pasted code).
          // We render anyway and surface the assets as a quiet chip nudge below.
          //
          // While the expand modal is open we unmount this in-grid preview: a
          // heavy WebGL component would otherwise run a second animation loop /
          // GL context behind the modal, stealing GPU from the interactive copy
          // and making drag/zoom flicker. It re-mounts on close.
          <PreviewSandbox component={component} />
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

        {allowed && (
          <button
            className="backdrop-toggle"
            style={{ left: canToggle ? 50 : 10 }}
            onClick={() => onSetBackdrop(nextBackdrop(component.backdrop))}
            aria-label="cycle preview backdrop"
            title={`Backdrop: ${component.backdrop ?? 'none'} — click to cycle (for glass/overlay components)`}
          >
            ▦
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

        {allowed && (
          <button
            className="expand-btn"
            onClick={() => setExpanded(true)}
            aria-label={`expand ${component.name} preview`}
            title="Expand to full size"
          >
            ⛶
          </button>
        )}

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
        <span className="meta-right">
          {showHint && <span className="meta-hint" title="Move your cursor over the preview">✦ move cursor</span>}
          {assetRefs.length > 0 && (
            <button
              className={`asset-chip${missingCount > 0 ? ' missing' : ' ok'}`}
              onClick={() => setAssetsOpen(true)}
              title={
                missingCount > 0
                  ? `Optional: ${missingCount} referenced file${missingCount > 1 ? 's' : ''} not provided. The preview works without them — click to add images if you have them.`
                  : 'All referenced files provided'
              }
            >
              {missingCount > 0 ? `＋ ${missingCount} optional` : '✓ assets'}
            </button>
          )}
          <span className="meta">{component.framework} ·</span>
          <span className="cat-select-wrap" title="Click to move this to another category">
            <select
              className="cat-select"
              value={component.subcategory}
              onChange={(e) => onSetSubcategory(e.target.value)}
              aria-label="component category"
            >
              {(CAT_ORDER.includes(component.subcategory)
                ? CAT_ORDER
                : [component.subcategory, ...CAT_ORDER]
              ).map((slug) => (
                <option key={slug} value={slug}>
                  {catLabel(slug)}
                </option>
              ))}
            </select>
            <span className="cat-caret" aria-hidden>▾</span>
          </span>
        </span>
      </div>

      {assetsOpen && (
        <AssetsModal
          component={component}
          refs={assetRefs}
          onClose={() => setAssetsOpen(false)}
          onUploaded={onAssetUploaded}
        />
      )}

      {expanded &&
        allowed &&
        createPortal(
          <div className="overlay" onClick={() => setExpanded(false)}>
            <div className="expand-modal" onClick={(e) => e.stopPropagation()}>
              <div className="expand-head">
                <span className="name" title={component.name}>
                  {component.name}
                </span>
                <button className="icon-btn x" onClick={() => setExpanded(false)} aria-label="Close">
                  ✕
                </button>
              </div>
              <div
                className="expand-stage"
                style={{ background: backdropCss(component.backdrop) ?? sc.bg }}
              >
                <PreviewSandbox component={component} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </article>
  );
}
