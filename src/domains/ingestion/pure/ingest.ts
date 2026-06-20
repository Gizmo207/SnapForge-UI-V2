import { detectFramework, type Framework } from './detectFramework';
import { classify } from './classify';
import { inferName } from './inferName';
import { detectDependencies } from './detectDependencies';

export type IngestionResult = {
  framework: Framework;
  name: string;
  category: string;
  subcategory: string;
  tags: string[];
  dependencies: string[];
};

/**
 * Composes the ingestion pipeline. Pure, total, deterministic, and never throws
 * to the caller: malformed input is contained as a safe fallback result rather
 * than an exception that could reach the gallery. Ingestion never decides
 * safety — that is the Sanitization gate's job.
 */
export function ingest(code: string): IngestionResult {
  const source = typeof code === 'string' ? code : '';

  try {
    const framework = detectFramework(source);
    const classification = classify(source);
    const name = inferName(source, {
      subcategory: classification.subcategory,
      tags: classification.tags,
    });
    const dependencies = detectDependencies(source);

    return {
      framework,
      name,
      category: classification.category,
      subcategory: classification.subcategory,
      tags: classification.tags,
      dependencies,
    };
  } catch {
    // Safe fallback: ingestion is total and must never crash the caller.
    return {
      framework: 'html',
      name: 'Component',
      category: 'components',
      subcategory: 'misc',
      tags: [],
      dependencies: [],
    };
  }
}
