import type { Framework } from '../ingestion/pure/detectFramework';
import type { SanitizationOutcome } from '../sanitization/pure/types';

/** A user-supplied file a component references (3D model, image, font, …). */
export type ComponentAsset = {
  refPath: string;
  url: string;
  filename: string;
};

/**
 * A preview backdrop the user can drop behind any component — so overlay/glass
 * components (which have no look of their own) render over something to refract,
 * without hand-crafting a demo wrapper. `null`/`undefined` => the plain stage.
 */
export type BackdropId = 'mono' | 'mesh' | 'grid' | 'dots' | 'dark';

/**
 * The central durable entity. Render/export authority lives in
 * `sanitizationOutcome`, never in the mere existence of the record.
 */
export type Component = {
  componentId: string;
  name: string;
  framework: Framework;
  source: string;
  /** Cleaned/validated artifact; present only when sanitizationOutcome === 'allowed'. */
  sanitizedArtifact: string | null;
  sanitizationOutcome: SanitizationOutcome;
  category: string;
  subcategory: string;
  tags: string[];
  dependencies: string[];
  /** User's per-card showcase background override; null/undefined => auto-detect. */
  showcaseTheme?: 'light' | 'dark' | null;
  /** User's per-card preview backdrop; null/undefined => the plain stage. */
  backdrop?: BackdropId | null;
  /** User-uploaded files this component references; wired into the preview. */
  assets?: ComponentAsset[];
  /** Optional usage/demo JSX so wrapper components render with real content. */
  demoSource?: string | null;
  /** Optional secondary artifacts (e.g. an HTML variant + CSS) for export. */
  htmlSource?: string | null;
  cssSource?: string | null;
  createdAt: string;
  updatedAt: string;
};
