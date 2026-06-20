export type SanitizationOutcome = 'allowed' | 'blocked' | 'invalid';

/**
 * The render/export authority for a snippet. `sanitizedArtifact` is non-null
 * ONLY when outcome is 'allowed'. `reasons` explains a 'blocked'/'invalid'
 * outcome (and is empty when allowed).
 */
export type SanitizationDecision = {
  outcome: SanitizationOutcome;
  sanitizedArtifact: string | null;
  reasons: string[];
};

export const blocked = (reasons: string[]): SanitizationDecision => ({
  outcome: 'blocked',
  sanitizedArtifact: null,
  reasons,
});

export const invalid = (reasons: string[]): SanitizationDecision => ({
  outcome: 'invalid',
  sanitizedArtifact: null,
  reasons,
});

export const allowed = (sanitizedArtifact: string): SanitizationDecision => ({
  outcome: 'allowed',
  sanitizedArtifact,
  reasons: [],
});
