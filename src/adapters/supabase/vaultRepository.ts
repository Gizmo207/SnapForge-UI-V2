import type { Component, ComponentAsset } from '../../domains/shared/component';
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
  showcase_theme: 'light' | 'dark' | null;
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
    showcaseTheme: row.showcase_theme ?? null,
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
    showcase_theme: component.showcaseTheme ?? null,
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

type AssetRow = {
  component_id: string;
  ref_path: string;
  public_url: string;
  filename: string;
};

async function attachAssets(components: Component[]): Promise<Component[]> {
  if (components.length === 0) return components;
  const supabase = getSupabaseServerClient();
  const ids = components.map((c) => c.componentId);
  const { data, error } = await supabase
    .from('component_assets')
    .select('component_id, ref_path, public_url, filename')
    .in('component_id', ids);
  if (error) return components.map((c) => ({ ...c, assets: [] }));

  const byComponent = new Map<string, ComponentAsset[]>();
  for (const row of (data ?? []) as AssetRow[]) {
    const list = byComponent.get(row.component_id) ?? [];
    list.push({ refPath: row.ref_path, url: row.public_url, filename: row.filename });
    byComponent.set(row.component_id, list);
  }
  return components.map((c) => ({ ...c, assets: byComponent.get(c.componentId) ?? [] }));
}

export async function listComponents(ownerId: string): Promise<Component[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('components')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`listComponents failed: ${error.message}`);
  return attachAssets((data as Row[]).map(toComponent));
}

export async function addComponentAsset(params: {
  componentId: string;
  ownerId: string;
  refPath: string;
  storagePath: string;
  publicUrl: string;
  filename: string;
  contentType: string;
  size: number;
}): Promise<ComponentAsset> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('component_assets').upsert(
    {
      component_id: params.componentId,
      owner_id: params.ownerId,
      ref_path: params.refPath,
      storage_path: params.storagePath,
      public_url: params.publicUrl,
      filename: params.filename,
      content_type: params.contentType,
      size: params.size,
    },
    { onConflict: 'component_id,ref_path' },
  );
  if (error) throw new Error(`addComponentAsset failed: ${error.message}`);
  return { refPath: params.refPath, url: params.publicUrl, filename: params.filename };
}

/** Confirms a component belongs to the owner (authorization for asset upload). */
export async function ownsComponent(componentId: string, ownerId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('components')
    .select('component_id')
    .eq('component_id', componentId)
    .eq('owner_id', ownerId)
    .maybeSingle();
  return !error && !!data;
}

export async function updateShowcaseTheme(
  componentId: string,
  ownerId: string,
  theme: 'light' | 'dark' | null,
): Promise<Component> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('components')
    .update({ showcase_theme: theme })
    .eq('component_id', componentId)
    .eq('owner_id', ownerId)
    .select()
    .single();
  if (error) throw new Error(`updateShowcaseTheme failed: ${error.message}`);
  return toComponent(data as Row);
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
  return attachAssets((data as Row[]).map(toComponent));
}

const ASSET_BUCKET = 'component-assets';

/** Uploads an asset file to storage and returns its public URL + storage path. */
export async function uploadAssetFile(params: {
  ownerId: string;
  componentId: string;
  filename: string;
  contentType: string;
  body: Buffer;
}): Promise<{ storagePath: string; publicUrl: string }> {
  const supabase = getSupabaseServerClient();
  const safe = params.filename.replace(/[^\w.\-]+/g, '_');
  const storagePath = `${params.ownerId}/${params.componentId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage
    .from(ASSET_BUCKET)
    .upload(storagePath, params.body, { contentType: params.contentType, upsert: true });
  if (error) throw new Error(`uploadAssetFile failed: ${error.message}`);
  const { data } = supabase.storage.from(ASSET_BUCKET).getPublicUrl(storagePath);
  return { storagePath, publicUrl: data.publicUrl };
}
