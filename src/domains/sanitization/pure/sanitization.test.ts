import { describe, it, expect } from 'vitest';
import { decideSanitization } from './sanitizationDecision';
import { sanitizationCorpus } from '../../../tests/fixtures/adversarialCorpus';

describe('sanitization gate (adversarial + safe corpus)', () => {
  for (const fixture of sanitizationCorpus) {
    it(`${fixture.expected.padEnd(7)} :: ${fixture.id}`, () => {
      const decision = decideSanitization(fixture.source, fixture.framework);
      expect(decision.outcome).toBe(fixture.expected);
    });
  }
});

describe('sanitization invariants', () => {
  it('only allowed outcomes carry a sanitized artifact', () => {
    for (const fixture of sanitizationCorpus) {
      const d = decideSanitization(fixture.source, fixture.framework);
      if (d.outcome === 'allowed') {
        expect(d.sanitizedArtifact).not.toBeNull();
      } else {
        expect(d.sanitizedArtifact).toBeNull();
      }
    }
  });

  it('blocked/invalid outcomes always explain why', () => {
    for (const fixture of sanitizationCorpus) {
      const d = decideSanitization(fixture.source, fixture.framework);
      if (d.outcome !== 'allowed') {
        expect(d.reasons.length).toBeGreaterThan(0);
      }
    }
  });

  it('is default-deny on empty source for both frameworks', () => {
    expect(decideSanitization('', 'html').outcome).toBe('blocked');
    expect(decideSanitization('   ', 'react').outcome).toBe('blocked');
  });

  it('is deterministic', () => {
    const src = sanitizationCorpus[0].source;
    expect(decideSanitization(src, 'html')).toEqual(decideSanitization(src, 'html'));
  });

  it('is not defeated by casing/whitespace tricks (AST/DOM, not substrings)', () => {
    // Upper-cased event handler still stripped by DOMPurify -> blocked.
    expect(decideSanitization(`<button ONCLICK="x()">y</button>`, 'html').outcome).toBe('blocked');
    // Whitespace inside a "window . location" string does not make it an identifier reference.
    expect(decideSanitization(`<p>the word window . location is just text</p>`, 'html').outcome).toBe('allowed');
  });
});
