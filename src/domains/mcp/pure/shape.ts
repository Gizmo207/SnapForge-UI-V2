/**
 * Pure shaping of a vault `Component` into the payloads the MCP tools return to
 * an AI coding agent. Two shapes: a lightweight summary (for search/list, so the
 * agent can scan the vault cheaply) and a full, export-ready payload (for
 * get_component, with everything needed to drop the component into a project).
 * Pure and deterministic — no DB, no network.
 */

import type { Component } from '../../shared/component';

export type ComponentSummary = {
  id: string;
  name: string;
  framework: string;
  category: string;
  subcategory: string;
  tags: string[];
  multiFile: boolean;
};

export type ComponentPayload = ComponentSummary & {
  dependencies: string[];
  /** Single-file source (the sanitized, export-ready artifact when present). */
  source: string | null;
  /** Multi-file map (path -> content) when the component is multi-file. */
  files: Record<string, string> | null;
  entryPath: string | null;
  css: string | null;
  demo: string | null;
};

export function toSummary(c: Component): ComponentSummary {
  return {
    id: c.componentId,
    name: c.name,
    framework: c.framework,
    category: c.category,
    subcategory: c.subcategory,
    tags: c.tags ?? [],
    multiFile: !!c.files && Object.keys(c.files).length > 0,
  };
}

export function toPayload(c: Component): ComponentPayload {
  return {
    ...toSummary(c),
    dependencies: c.dependencies ?? [],
    // Prefer the sanitized artifact (what we'd actually render/export); fall back
    // to the raw source so the agent always gets something usable.
    source: c.sanitizedArtifact ?? c.source ?? null,
    files: c.files ?? null,
    entryPath: c.entryPath ?? null,
    css: c.cssSource ?? null,
    demo: c.demoSource ?? null,
  };
}

/** Keyword match over a component's searchable text (name, tags, category). Pure;
 * the caller supplies the already-owner-scoped component list. */
export function matchesQuery(c: Component, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const terms = q.split(/\s+/);
  const hay = [c.name, c.category, c.subcategory, ...(c.tags ?? [])].join(' ').toLowerCase();
  return terms.every((t) => hay.includes(t));
}
