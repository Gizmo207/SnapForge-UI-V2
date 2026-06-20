import type { Component } from '../../domains/shared/component';
import type { Framework } from '../../domains/ingestion/pure/detectFramework';
import type { SanitizationOutcome } from '../../domains/sanitization/pure/types';
import { getSupabaseServerClient } from './client';

/**
 * I/O adapter for the Component Vault. Maps between the domain `Component` and
 * the `components` table. It performs no decisions; it persists what the capture
 * controller produced.
 */

type Row = {
  component_id: string;
  owner_id: string;
  name: string;
  framework: Framework;
  source: string;
  sanitized_artifact: string | null;
  sanitization_outcome: SanitizationOutcome;
  category: string;
  subcategory: string;
  tags: string[];
  dependencies: string[];
  html_source: string | null;
  css_source: string | null;
  created_at: string;
  updated_at: string;
};

function toComponent(row: Row): Component {
  return {
    componentId: row.component_id,
    name: row.name,
    framework: row.framework,
    source: row.source,
    sanitizedArtifact: row.sanitized_artifact,
    sanitizationOutcome: row.sanitization_outcome,
    category: row.category,
    subcategory: row.subcategory,
    tags: row.tags ?? [],
    dependencies: row.dependencies ?? [],
    htmlSource: row.html_source,
    cssSource: row.css_source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(component: Component, ownerId: string): Row {
  return {
    component_id: component.componentId,
    owner_id: ownerId,
    name: component.name,
    framework: component.framework,
    source: component.source,
    sanitized_artifact: component.sanitizedArtifact,
    sanitization_outcome: component.sanitizationOutcome,
    category: component.category,
    subcategory: component.subcategory,
    tags: component.tags,
    dependencies: component.dependencies,
    html_source: component.htmlSource ?? null,
    css_source: component.cssSource ?? null,
    created_at: component.createdAt,
    updated_at: component.updatedAt,
  };
}

export async function saveComponent(component: Component, ownerId: string): Promise<Component> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('components')
    .upsert(toRow(component, ownerId))
    .select()
    .single();
  if (error) throw new Error(`saveComponent failed: ${error.message}`);
  return toComponent(data as Row);
}

export async function listComponents(ownerId: string): Promise<Component[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('components')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`listComponents failed: ${error.message}`);
  return (data as Row[]).map(toComponent);
}

export async function getComponentsByIds(ids: string[], ownerId: string): Promise<Component[]> {
  if (ids.length === 0) return [];
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('components')
    .select('*')
    .eq('owner_id', ownerId)
    .in('component_id', ids);
  if (error) throw new Error(`getComponentsByIds failed: ${error.message}`);
  return (data as Row[]).map(toComponent);
}
