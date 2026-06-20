import type { Framework } from '../../ingestion/pure/detectFramework';
import { htmlGate } from './htmlGate';
import { jsxGate } from './jsxGate';
import { invalid, type SanitizationDecision } from './types';

export type { SanitizationDecision, SanitizationOutcome } from './types';

/**
 * The sanitization gate — the boundary invariant of SnapForge v2.
 *
 *   Untrusted pasted code must pass this gate before it can render or export.
 *
 * Pure, deterministic, default-deny. Routes to the framework-appropriate gate.
 * The decision is the SOLE authority for whether a snippet may render (in the
 * sandbox) or be written to an export bundle. Preview and Export consume this
 * outcome; they never re-derive or soften it.
 */
export function decideSanitization(source: string, framework: Framework): SanitizationDecision {
  try {
    return framework === 'react' ? jsxGate(source) : htmlGate(source);
  } catch {
    // Any unexpected failure in the gate is a hard failure, never a silent allow.
    return invalid(['sanitization gate raised an unexpected error']);
  }
}
