import type { Framework } from '../ingestion/pure/detectFramework';
import type { SanitizationOutcome } from '../sanitization/pure/types';

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
  /** Optional secondary artifacts (e.g. an HTML variant + CSS) for export. */
  htmlSource?: string | null;
  cssSource?: string | null;
  createdAt: string;
  updatedAt: string;
};
